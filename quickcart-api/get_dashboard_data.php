<?php
require_once 'db_connection.php';

function getExistingCol($pdo, $table,$possibleCols) {
    try {
        $stmt =$pdo->query("SHOW COLUMNS FROM `$table`");
        $existingCols =$stmt->fetchAll(PDO::FETCH_COLUMN);
        foreach ($possibleCols as$col) {
            if (in_array($col, $existingCols)) return$col;
        }
    } catch (Exception $e) { return null; }
    return null;
}

$timeframe = strtolower($_GET['timeframe'] ?? 'weekly');

try {
    // --- 1. STAT CARDS ---
    $activeTxnCount = (int)$pdo->query("
        SELECT COUNT(*) FROM transactions WHERE LOWER(TRIM(order_status)) NOT IN ('cancelled', 'canceled')
    ")->fetchColumn();

    $realRev = (float)$pdo->query("
        SELECT COALESCE(SUM(amount), 0) FROM payments WHERE LOWER(TRIM(payment_status)) IN ('paid', 'completed', 'success', '1')
    ")->fetchColumn();

    $paidCount = (int)$pdo->query("
        SELECT COUNT(*) FROM payments WHERE LOWER(TRIM(payment_status)) IN ('paid', 'completed', 'success', '1')
    ")->fetchColumn();

    if ($realRev == 0 &&$activeTxnCount > 0) {
        $realRev = (float)$pdo->query("
            SELECT COALESCE(SUM(total_amount), 0) FROM transactions WHERE LOWER(TRIM(order_status)) IN ('completed', 'delivered', 'paid')
        ")->fetchColumn();

        $paidCount = (int)$pdo->query("
            SELECT COUNT(*) FROM transactions WHERE LOWER(TRIM(order_status)) IN ('completed', 'delivered', 'paid')
        ")->fetchColumn();
    }

    $expectedRev = (float)$pdo->query("
        SELECT COALESCE(SUM(total_amount), 0) FROM transactions WHERE LOWER(TRIM(order_status)) NOT IN ('cancelled', 'canceled')
    ")->fetchColumn();

    $unpaidCount = max(0, $activeTxnCount -$paidCount);

    $cancelledLoss = (float)$pdo->query("
        SELECT COALESCE(SUM(total_amount), 0) FROM transactions WHERE LOWER(TRIM(order_status)) IN ('cancelled', 'canceled')
    ")->fetchColumn();

    $stockLoss = 0.0;
    try {
        $stockLoss = (float)$pdo->query("
            SELECT COALESCE(SUM(sm.quantity * p.price), 0)
            FROM stock_movements sm
            JOIN stock_batches sb ON sm.batch_id = sb.batch_id
            JOIN products p ON sb.product_id = p.product_id
            WHERE LOWER(TRIM(sm.movement_type)) IN ('expired', 'damaged')
        ")->fetchColumn();
    } catch (Exception $e) {}

    $totalLost = $cancelledLoss +$stockLoss;

    $totalCustomers = (int)$pdo->query("
        SELECT COUNT(*) FROM users WHERE LOWER(TRIM(role)) IN ('customer', 'user', 'client')
    ")->fetchColumn();

    if ($totalCustomers == 0) {
        $totalCustomers = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    }


    // --- 2. MODULE 2: PIE CHART METRICS ---
    $completedCount  = (int)$pdo->query("SELECT COUNT(*) FROM transactions WHERE LOWER(TRIM(order_status)) IN ('completed', 'delivered')")->fetchColumn();
    $processingCount = (int)$pdo->query("SELECT COUNT(*) FROM transactions WHERE LOWER(TRIM(order_status)) = 'processing'")->fetchColumn();
    $pendingCount    = (int)$pdo->query("SELECT COUNT(*) FROM transactions WHERE LOWER(TRIM(order_status)) = 'pending'")->fetchColumn();

    $completedPct  =$activeTxnCount > 0 ? (int)round(($completedCount / $activeTxnCount) * 100) : 0;
    $processingPct =$activeTxnCount > 0 ? (int)round(($processingCount / $activeTxnCount) * 100) : 0;
    $pendingPct    =$activeTxnCount > 0 ? max(0, 100 - ($completedPct +$processingPct)) : 100;

    $topCatName = "Meat";
    $topCatPct = 100;
    $otherCatPct = 0;
    try {
        $priceCol = getExistingCol($pdo, 'transaction_items', ['unit_price', 'price', 'subtotal', 'total_price']);
        if ($priceCol) {
            $catStmt =$pdo->query("
                SELECT COALESCE(c.name, 'Produce') AS cat_name, SUM(ti.quantity * ti.`$priceCol`) AS total_sales
                FROM transaction_items ti
                JOIN products p ON ti.product_id = p.product_id
                LEFT JOIN categories c ON p.category_id = c.category_id
                GROUP BY c.category_id, c.name ORDER BY total_sales DESC LIMIT 1
            ")->fetch();

            if ($catStmt && $expectedRev > 0) {$topCatName = $catStmt['cat_name'];$topCatPct  = (int)round(($catStmt['total_sales'] /$expectedRev) * 100);
                $otherCatPct = max(0, 100 -$topCatPct);
            }
        }
    } catch (Exception $e) {}

    $cashPct = 0;
    $digitalPct = 100;
    try {
        $payMethodCol = getExistingCol($pdo, 'payments', ['payment_method', 'method', 'payment_type', 'type', 'mode']);
        if ($payMethodCol) {
            $cashCount = (int)$pdo->query("
                SELECT COUNT(*) FROM payments 
                WHERE LOWER(TRIM(`$payMethodCol`)) IN ('cash', 'cod', 'cash on delivery')
            ")->fetchColumn();
            $totalPayments = (int)$pdo->query("SELECT COUNT(*) FROM payments")->fetchColumn();
            if ($totalPayments > 0) {$cashPct = (int)round(($cashCount / $totalPayments) * 100);
                $digitalPct = 100 -$cashPct;
            }
        }
    } catch (Exception $e) {}

    $deliveryCount = (int)$pdo->query("SELECT COUNT(*) FROM transactions WHERE LOWER(TRIM(fulfillment_type)) = 'delivery'")->fetchColumn();
    $deliveryPct =$activeTxnCount > 0 ? (int)round(($deliveryCount / $activeTxnCount) * 100) : 50;
    $pickupPct = 100 -$deliveryPct;

    $paidPct   =$expectedRev > 0 ? (int)round(($realRev / $expectedRev) * 100) : 50;
    $unpaidPct = $expectedRev > 0 ? (100 -$paidPct) : 50;


    // --- 3. MODULE 3: BAR CHART (ALWAYS FULL TIME GRID BUCKETS) ---
    $dateCol = getExistingCol($pdo, 'transactions', ['created_at', 'order_date', 'transaction_date', 'date']);
    $fulfillmentBuckets = [];$customerBuckets = [];

    if ($timeframe === 'daily') {
        // Build last 7 days grid (Mon..Sun or Past 7 Days)
        for ($i = 6; $i >= 0; $i--) {
            $lbl = date('D', strtotime("-$i days"));
            $fulfillmentBuckets[$lbl] = ['label' =>$lbl, 'delivery' => 0, 'pickup' => 0];
            $customerBuckets[$lbl]    = ['label' => $lbl, 'value' => 0];         }$dbFormat = '%a';
        $intervalDays = 7;     } else if ($timeframe === 'monthly') {
        // Build last 6 months grid (Apr..Sep)
        for ($i = 5; $i >= 0; $i--) {
            $lbl = date('M', strtotime("-$i months"));
            $fulfillmentBuckets[$lbl] = ['label' => $lbl, 'delivery' => 0, 'pickup' => 0];$customerBuckets[$lbl]    = ['label' =>$lbl, 'value' => 0];
        }
        $dbFormat = '\%b';$intervalDays = 180;
    } else {
        // Default: Weekly (Wk 1, Wk 2, Wk 3, Wk 4)
        for ($i = 3; $i >= 0; $i--) {
            $lbl = "Wk " . (4 - $i);
            $fulfillmentBuckets[$lbl] = ['label' => $lbl, 'delivery' => 0, 'pickup' => 0];$customerBuckets[$lbl]    = ['label' =>$lbl, 'value' => 0];
        }
        $dbFormat = '\%a'; // Matched by loop index or mapped$intervalDays = 28;
    }

    // Merge Real Fulfillment DB Rows
    try {
        if ($dateCol) {
            $fCol = getExistingCol($pdo, 'transactions', ['fulfillment_type', 'delivery_type', 'type']);
            $fColQuery =$fCol ? "LOWER(TRIM(`$fCol`))" : "'delivery'";
            
            $rows =$pdo->query("
                SELECT 
                    DATE_FORMAT(`$dateCol`, '$dbFormat') AS db_lbl,$fColQuery AS f_type,
                    COUNT(*) AS total
                FROM transactions
                WHERE `$dateCol` >= NOW() - INTERVAL $intervalDays DAY
                GROUP BY db_lbl, f_type
            ")->fetchAll(PDO::FETCH_ASSOC);

            $bucketKeys = array_keys($fulfillmentBuckets);
            foreach ($rows as$r) {
                $isPickup = strpos($r['f_type'], 'pick') !== false;
                $targetKey =$r['db_lbl'];

                // If weekly, map DB row into active week bucket
                if ($timeframe === 'weekly') {
                    $targetKey = end($bucketKeys); // Map recent into current week
                }

                if (isset($fulfillmentBuckets[$targetKey])) {
                    if ($isPickup) {$fulfillmentBuckets[$targetKey]['pickup'] += (int)$r['total'];
                    } else {
                        $fulfillmentBuckets[$targetKey]['delivery'] += (int)$r['total'];
                    }
                }
            }
        }
    } catch (Exception $e) {}

    // Categories
    $categoryData = [];
    try {
        $priceCol = getExistingCol($pdo, 'transaction_items', ['unit_price', 'price', 'subtotal', 'total_price']);
        if ($priceCol &&$dateCol) {
            $categoryData =$pdo->query("
                SELECT 
                    COALESCE(c.name, 'Produce') AS label,
                    ROUND(SUM(ti.quantity * ti.`$priceCol`), 2) AS value
                FROM transaction_items ti
                JOIN transactions t ON ti.transaction_id = t.transaction_id
                JOIN products p ON ti.product_id = p.product_id
                LEFT JOIN categories c ON p.category_id = c.category_id
                WHERE t.`$dateCol` >= NOW() - INTERVAL $intervalDays DAY
                GROUP BY c.category_id, c.name
                ORDER BY value DESC LIMIT 5
            ")->fetchAll(PDO::FETCH_ASSOC);
        }
    } catch (Exception $e) {}

    // Products
    $productData = [];
    try {
        if ($dateCol) {
            $productData =$pdo->query("
                SELECT 
                    p.name AS label,
                    SUM(ti.quantity) AS value
                FROM transaction_items ti
                JOIN transactions t ON ti.transaction_id = t.transaction_id
                JOIN products p ON ti.product_id = p.product_id
                WHERE t.`$dateCol` >= NOW() - INTERVAL $intervalDays DAY
                GROUP BY p.product_id, p.name
                ORDER BY value DESC LIMIT 5
            ")->fetchAll(PDO::FETCH_ASSOC);
        }
    } catch (Exception $e) {}


    // --- 4. LIST WIDGETS ---
    $expiringGoods =$pdo->query("
        SELECT 
            CONCAT('#CM980', sb.batch_id) AS id,
            p.name AS item,
            DATE_FORMAT(sb.expiry_date, '%b %d') AS extra
        FROM stock_batches sb
        JOIN products p ON sb.product_id = p.product_id
        WHERE sb.expiry_date IS NOT NULL
        ORDER BY sb.expiry_date ASC LIMIT 5
    ")->fetchAll();

    $lowStock =$pdo->query("
        SELECT 
            CONCAT('#CM980', p.product_id) AS id,
            p.name AS item,
            COALESCE(SUM(sb.quantity_remaining), 0) AS extra
        FROM products p
        LEFT JOIN stock_batches sb ON p.product_id = sb.product_id
        GROUP BY p.product_id, p.name ORDER BY extra ASC LIMIT 5
    ")->fetchAll();


    // PAYLOAD OUTPUT
    echo json_encode([
        "success" => true,
        "timeframe" => $timeframe,
        "stats" => [
            "real_revenue"     => "$" . number_format($realRev, 2),
            "paid_orders"      => $paidCount . ($paidCount === 1 ? " Paid Order" : " Paid Orders"),
            "expected_revenue" => "$" . number_format($expectedRev, 2),
            "unpaid_orders"    => $unpaidCount . ($unpaidCount === 1 ? " Unpaid Order" : " Unpaid Orders"),
            "total_lost"       => "$" . number_format($totalLost, 2),
            "lost_subtext"     => "Cancelled & Spoiled",
            "total_customers"  => $totalCustomers . ($totalCustomers === 1 ? " Customer" : " Customers"),
            "customer_subtext" => "Registered Accounts"
        ],
        "pieChart" => [
            "fulfillment" => [
                "completedPct"  => $completedPct,
                "processingPct" => $processingPct,
                "pendingPct"    => $pendingPct,
                "completed"     => $completedCount,
                "processing"    => $processingCount,
                "pending"       => $pendingCount
            ],
            "categoryMix" => [
                "topCategory" => $topCatName,
                "topPct"      => $topCatPct,
                "othersPct"   => $otherCatPct
            ],
            "paymentMethods" => [
                "cashPct"    => $cashPct,
                "digitalPct" => $digitalPct
            ],
            "deliveryTypes" => [
                "deliveryPct" => $deliveryPct,
                "pickupPct"   => $pickupPct
            ],
            "revenueRatio" => [
                "paidPct"      => $paidPct,
                "unpaidPct"    => $unpaidPct,
                "paidAmount"   => "$" . number_format($realRev, 2),
                "unpaidAmount" => "$" . number_format(max(0, $expectedRev -$realRev), 2)
            ]
        ],
        "barChart" => [
            "fulfillment" => array_values($fulfillmentBuckets),
            "categories"  => $categoryData,
            "products"    => $productData,
            "customers"   => array_values($customerBuckets)
        ],
        "expiringGoods" => $expiringGoods,
        "lowStock"      => $lowStock
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>