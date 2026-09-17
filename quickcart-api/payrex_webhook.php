<?php
// Register this URL in your PayRex dashboard as the webhook endpoint.
// PayRex will POST here directly (no browser/session involved), so there is
// no session_start() or CORS handling — auth is the signature check below.

require __DIR__ . "/db_connection.php";
require __DIR__ . "/config.php"; // <- put putenv() calls for local secrets here

$webhookSecret = getenv("PAYREX_WEBHOOK_SECRET_KEY");
$rawPayload = file_get_contents("php://input");
$signatureHeader = $_SERVER['HTTP_PAYREX_SIGNATURE'] ?? '';

if (!$webhookSecret || !$signatureHeader) {
    http_response_code(400);
    exit;
}

// Header looks like: t=1496734175,te=<test-sig>,li=<live-sig>
$parts = [];
foreach (explode(",", $signatureHeader) as $pair) {
    [$key, $value] = array_pad(explode("=", $pair, 2), 2, null);
    if ($key !== null) {
        $parts[$key] = $value;
    }
}

$timestamp = $parts['t'] ?? null;
$testSig = $parts['te'] ?? null;
$liveSig = $parts['li'] ?? null;

if (!$timestamp || (!$testSig && !$liveSig)) {
    http_response_code(400);
    exit;
}

$expectedSig = hash_hmac("sha256", $timestamp . "." . $rawPayload, $webhookSecret);

$isValid = ($testSig && hash_equals($expectedSig, $testSig))
    || ($liveSig && hash_equals($expectedSig, $liveSig));

if (!$isValid) {
    http_response_code(400);
    exit;
}

$event = json_decode($rawPayload, true);
$eventType = $event['type'] ?? '';

// payment_intent.succeeded is the event documented by the PayRex SDK. The
// checkout-session event is kept as a compatibility branch for configured
// webhooks that listen to checkout session completion.
$successEvents = ['payment_intent.succeeded', 'checkout_session.completed'];
$failureEvents = ['payment_intent.payment_failed', 'checkout_session.expired'];

try {
    // PayRex event payloads put the resource in data.data. Older sample code
    // used data.resource, so keep that fallback for previously captured events.
    $resource = $event['data']['data']
        ?? $event['data']['resource']
        ?? $event['data']
        ?? [];

    if (isset($resource['data']) && is_array($resource['data'])) {
        $resource = $resource['data'];
    }

    $metadata = $resource['metadata']
        ?? $resource['payment_intent']['metadata']
        ?? [];
    $transactionId = (int)($metadata['transaction_id'] ?? 0);

    if ($transactionId <= 0) {
        error_log("PayRex webhook ignored: transaction_id metadata missing. Event type: " . $eventType);
        http_response_code(200); // acknowledge so PayRex doesn't retry forever
        echo json_encode(["received" => true, "note" => "no transaction_id in metadata"]);
        exit;
    }

    if (in_array($eventType, $successEvents, true)) {
        $pdo->beginTransaction();

        // Lock the row so a duplicate webhook delivery can't double-deduct stock
        $check = $pdo->prepare("SELECT payment_status FROM payments WHERE transaction_id = ? FOR UPDATE");
        $check->execute([$transactionId]);
        $payment = $check->fetch();

        if ($payment && $payment['payment_status'] === 'pending') {
            $paymentReference = $resource['id'] ?? $event['id'] ?? null;

            $pdo->prepare(
                "UPDATE payments SET payment_status = 'paid', payment_reference = ?, paid_at = CURRENT_TIMESTAMP
                 WHERE transaction_id = ?"
            )->execute([$paymentReference, $transactionId]);

            $pdo->prepare(
                "UPDATE transactions SET order_status = 'processing' WHERE transaction_id = ?"
            )->execute([$transactionId]);

            $items = $pdo->prepare(
                "SELECT product_id, quantity FROM transaction_items WHERE transaction_id = ?"
            );
            $items->execute([$transactionId]);

            foreach ($items->fetchAll() as $item) {
                $remainingToDeduct = (int)$item['quantity'];
                $productId = (int)$item['product_id'];

                // FIFO: use up batches expiring soonest first (oldest stock first)
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
            "UPDATE payments SET payment_status = 'failed' WHERE transaction_id = ? AND payment_status = 'pending'"
        )->execute([$transactionId]);

        $pdo->prepare(
            "UPDATE transactions SET order_status = 'cancelled' WHERE transaction_id = ? AND order_status = 'pending'"
        )->execute([$transactionId]);
    }

    http_response_code(200);
    echo json_encode(["received" => true]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(["received" => false, "error" => $e->getMessage()]);
}
