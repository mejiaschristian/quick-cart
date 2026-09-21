<?php
// Register this URL in your PayRex dashboard as the webhook endpoint.
// PayRex will POST here directly (no browser/session involved), so there is
// no session_start() or CORS handling — auth is the signature check below.

require __DIR__ . "/db_connection.php";
require __DIR__ . "/config.php";

$webhookSecret = getenv("PAYREX_WEBHOOK_SECRET_KEY");
$rawPayload = file_get_contents("php://input");

if (!$webhookSecret || $rawPayload === false || $rawPayload === "") {
    http_response_code(400);
    exit;
}

$signatureHeader = $_SERVER['HTTP_PAYREX_SIGNATURE']
    ?? $_SERVER['HTTP_X_PAYREX_SIGNATURE']
    ?? $_SERVER['HTTP_PAYREX_WEBHOOK_SIGNATURE']
    ?? $_SERVER['HTTP_X_PAYREX_WEBHOOK_SIGNATURE']
    ?? '';

if (!$signatureHeader) {
    http_response_code(400);
    exit;
}

$parts = [];
foreach (explode(",", $signatureHeader) as $pair) {
    $pair = trim((string)$pair);
    if ($pair === "") {
        continue;
    }

    [$key, $value] = array_pad(explode("=", $pair, 2), 2, null);
    if ($key !== null) {
        $parts[trim((string)$key)] = trim((string)($value ?? ''));
    }
}

$timestamp = $parts['t'] ?? $parts['timestamp'] ?? null;
$validSignatures = array_values(array_filter([
    $parts['te'] ?? null,
    $parts['li'] ?? null,
    $parts['v1'] ?? null,
    $parts['signature'] ?? null,
], fn($value) => $value !== null && $value !== ''));

if (!$timestamp || empty($validSignatures)) {
    http_response_code(400);
    exit;
}

$expectedSig = hash_hmac("sha256", $timestamp . "." . $rawPayload, $webhookSecret);
$isValid = false;
foreach ($validSignatures as $candidate) {
    if (hash_equals($expectedSig, $candidate)) {
        $isValid = true;
        break;
    }
}

if (!$isValid) {
    http_response_code(400);
    exit;
}

$event = json_decode($rawPayload, true);
if (!is_array($event)) {
    http_response_code(400);
    exit;
}

$eventType = strtolower((string)($event['type'] ?? $event['event'] ?? $event['name'] ?? ''));
$successEvents = [
    'payment_intent.succeeded',
    'payment.succeeded',
    'payment.completed',
    'payment_intent.completed',
    'checkout_session.completed',
    'checkout_session.success',
    'checkout_session.paid',
];
$failureEvents = [
    'payment_intent.payment_failed',
    'payment.failed',
    'checkout_session.expired',
    'checkout_session.cancelled',
];

try {
    $resource = $event['data']['data']
        ?? $event['data']['resource']
        ?? $event['data']
        ?? $event['resource']
        ?? [];

    if (isset($resource['data']) && is_array($resource['data'])) {
        $resource = $resource['data'];
    }

    $metadata = [];
    if (isset($resource['metadata']) && is_array($resource['metadata'])) {
        $metadata = $resource['metadata'];
    } elseif (isset($resource['payment_intent']['metadata']) && is_array($resource['payment_intent']['metadata'])) {
        $metadata = $resource['payment_intent']['metadata'];
    } elseif (isset($event['metadata']) && is_array($event['metadata'])) {
        $metadata = $event['metadata'];
    } elseif (isset($event['data']['metadata']) && is_array($event['data']['metadata'])) {
        $metadata = $event['data']['metadata'];
    }

    $transactionId = (int)($metadata['transaction_id'] ?? 0);

    if ($transactionId <= 0) {
        $sessionId = $resource['id'] ?? $event['id'] ?? $event['data']['id'] ?? null;

        if ($sessionId) {
            $sessionLookup = $pdo->prepare(
                "SELECT transaction_id FROM payments WHERE payrex_session_id = ? LIMIT 1"
            );
            $sessionLookup->execute([$sessionId]);
            $sessionMatch = $sessionLookup->fetch();

            if ($sessionMatch) {
                $transactionId = (int)$sessionMatch['transaction_id'];
            }
        }
    }

    if ($transactionId <= 0) {
        error_log("PayRex webhook ignored: no transaction match. Event type: " . $eventType);
        http_response_code(200);
        echo json_encode(["received" => true, "note" => "no transaction_id matched"]);
        exit;
    }

    if (in_array($eventType, $successEvents, true)) {
        $pdo->beginTransaction();

        $check = $pdo->prepare(
            "SELECT payment_status FROM payments WHERE transaction_id = ? FOR UPDATE"
        );
        $check->execute([$transactionId]);
        $payment = $check->fetch();

        if ($payment) {
            $paymentReference = $resource['id'] ?? $event['id'] ?? $payment['payment_reference'] ?? null;

            $pdo->prepare(
                "UPDATE payments
                 SET payment_status = 'paid', payment_reference = ?, paid_at = CURRENT_TIMESTAMP
                 WHERE transaction_id = ?"
            )->execute([$paymentReference, $transactionId]);

            $pdo->prepare(
                "UPDATE transactions SET order_status = 'processing'
                 WHERE transaction_id = ? AND order_status IN ('pending', 'processing')"
            )->execute([$transactionId]);

            $items = $pdo->prepare(
                "SELECT product_id, quantity FROM transaction_items WHERE transaction_id = ?"
            );
            $items->execute([$transactionId]);

            foreach ($items->fetchAll() as $item) {
                $remainingToDeduct = (int)$item['quantity'];
                $productId = (int)$item['product_id'];

                $batches = $pdo->prepare(
                    "SELECT batch_id, quantity_remaining FROM stock_batches
                     WHERE product_id = ? AND quantity_remaining > 0
                     ORDER BY expiry_date IS NULL, expiry_date ASC, batch_id ASC
                     FOR UPDATE"
                );
                $batches->execute([$productId]);

                foreach ($batches->fetchAll() as $batch) {
                    if ($remainingToDeduct <= 0) {
                        break;
                    }

                    $deduct = min($remainingToDeduct, (int)$batch['quantity_remaining']);

                    $pdo->prepare(
                        "UPDATE stock_batches SET quantity_remaining = quantity_remaining - ? WHERE batch_id = ?"
                    )->execute([$deduct, $batch['batch_id']]);

                    $pdo->prepare(
                        "INSERT INTO stock_movements (batch_id, movement_type, quantity, reference_id, created_by)
                         VALUES (?, 'sale', ?, ?, NULL)"
                    )->execute([$batch['batch_id'], $deduct, $transactionId]);

                    $remainingToDeduct -= $deduct;
                }
            }
        }

        $pdo->commit();
    } elseif (in_array($eventType, $failureEvents, true)) {
        $pdo->prepare(
            "UPDATE payments SET payment_status = 'failed'
             WHERE transaction_id = ? AND payment_status = 'pending'"
        )->execute([$transactionId]);

        $pdo->prepare(
            "UPDATE transactions SET order_status = 'cancelled'
             WHERE transaction_id = ? AND order_status IN ('pending', 'processing')"
        )->execute([$transactionId]);
    }

    http_response_code(200);
    echo json_encode(["received" => true, "transaction_id" => $transactionId]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode(["received" => false, "error" => $e->getMessage()]);
}
