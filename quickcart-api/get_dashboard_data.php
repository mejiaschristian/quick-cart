<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
require_once 'db_connection.php';

// Helper function: Auto-detect existing column in a table
function getExistingCol($pdo, $table, $possibleCols)
{
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM `$table`");
        $existingCols = $stmt->fetchAll(PDO::FETCH_COLUMN);
        foreach ($possibleCols as $col) {
            if (in_array($col, $existingCols)) return $col;
        }
    } catch (Exception $e) {
        return null;
    }
    return null;
}

// Request parameters
$timeframe     = strtolower($_GET['timeframe'] ?? 'weekly');
$selectedMonth = $_GET['month'] ?? date('Y-m'); // YYYY-MM
$selectedYear  = $_GET['year']  ?? date('Y');    // YYYY

try {
    // --- 1. TOP STAT CARDS ---
    $activeTxnCount = (int)$pdo->query("
        SELECT COUNT(*) FROM transactions WHERE LOWER(TRIM(order_status)) NOT IN ('cancelled', 'canceled')
    ")->fetchColumn();

    $realRev = (float)$pdo->query("
        SELECT COALESCE(SUM(amount), 0) FROM payments WHERE LOWER(TRIM(payment_status)) IN ('paid', 'completed', 'success', '1')
    ")->fetchColumn();

    $paidCount = (int)$pdo->query("
        SELECT COUNT(*) FROM payments WHERE LOWER(TRIM(payment_status)) IN ('paid', 'completed', 'success', '1')
    ")->fetchColumn();

    if ($realRev == 0 && $activeTxnCount > 0) {
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

    $unpaidCount = max(0, $activeTxnCount - $paidCount);

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
    } catch (Exception $e) {
    }

    $totalLost = $cancelledLoss + $stockLoss;

    // Strict Customer Filter (Excludes Admins & Employees)
    $totalCustomers = (int)$pdo->query("
        SELECT COUNT(*) FROM users 
        WHERE LOWER(TRIM(role)) IN ('customer', 'user', 'client') 
           OR LOWER(TRIM(role)) NOT IN ('admin', 'administrator', 'employee', 'staff')
    ")->fetchColumn();


    // --- 2. MODULE 2: PIE CHART METRICS ---
    $completedCount  = (int)$pdo->query("SELECT COUNT(*) FROM transactions WHERE LOWER(TRIM(order_status)) IN ('completed', 'delivered')")->fetchColumn();
    $processingCount = (int)$pdo->query("SELECT COUNT(*) FROM transactions WHERE LOWER(TRIM(order_status)) = 'processing'")->fetchColumn();
    $pendingCount    = (int)$pdo->query("SELECT COUNT(*) FROM transactions WHERE LOWER(TRIM(order_status)) = 'pending'")->fetchColumn();

    $completedPct  = $activeTxnCount > 0 ? (int)round(($completedCount / $activeTxnCount) * 100) : 0;
    $processingPct = $activeTxnCount > 0 ? (int)round(($processingCount / $activeTxnCount) * 100) : 0;
    $pendingPct    = $activeTxnCount > 0 ? max(0, 100 - ($completedPct + $processingPct)) : 100;

    $topCatName = "Meat";
    $topCatPct = 100;
    $otherCatPct = 0;
    try {
        $priceCol = getExistingCol($pdo, 'transaction_items', ['unit_price', 'price', 'subtotal', 'total_price']);
        if ($priceCol) {
            $catStmt = $pdo->query("
                SELECT COALESCE(c.name, 'Produce') AS cat_name, SUM(ti.quantity * ti.`$priceCol`) AS total_sales
                FROM transaction_items ti
                JOIN products p ON ti.product_id = p.product_id
                LEFT JOIN categories c ON p.category_id = c.category_id
                GROUP BY c.category_id, c.name ORDER BY total_sales DESC LIMIT 1
            ")->fetch();

            if ($catStmt && $expectedRev > 0) {
                $topCatName = $catStmt['cat_name'];
                $topCatPct  = (int)round(($catStmt['total_sales'] / $expectedRev) * 100);
                $otherCatPct = max(0, 100 - $topCatPct);
            }
        }
    } catch (Exception $e) {
    }

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
            if ($totalPayments > 0) {
                $cashPct = (int)round(($cashCount / $totalPayments) * 100);
                $digitalPct = 100 - $cashPct;
            }
        }
    } catch (Exception $e) {
    }

    $deliveryCount = (int)$pdo->query("SELECT COUNT(*) FROM transactions WHERE LOWER(TRIM(fulfillment_type)) = 'delivery'")->fetchColumn();
    $deliveryPct = $activeTxnCount > 0 ? (int)round(($deliveryCount / $activeTxnCount) * 100) : 50;
    $pickupPct = 100 - $deliveryPct;

    $paidPct   = $expectedRev > 0 ? (int)round(($realRev / $expectedRev) * 100) : 50;
    $unpaidPct = $expectedRev > 0 ? (100 - $paidPct) : 50;


    // --- 3. MODULE 3: AUTO-DETECT COLUMNS & STRICT DATE FILTERING ---
    $dateCol     = getExistingCol($pdo, 'transactions', ['created_at', 'order_date', 'transaction_date', 'date']);
    $tTxnIdCol   = getExistingCol($pdo, 'transactions', ['transaction_id', 'order_id', 'id']);
    $tiTxnIdCol  = getExistingCol($pdo, 'transaction_items', ['transaction_id', 'order_id', 'txn_id']);
    $priceCol    = getExistingCol($pdo, 'transaction_items', ['unit_price', 'price', 'subtotal', 'total_price']);
    $userDateCol = getExistingCol($pdo, 'users', ['created_at', 'registered_at', 'date']);

    $fulfillmentBuckets = [];
    $customerBuckets    = [];

    if ($timeframe === 'monthly') {
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        foreach ($months as $m) {
            $fulfillmentBuckets[$m] = ['label' => $m, 'delivery' => 0, 'pickup' => 0];
            $customerBuckets[$m]    = ['label' => $m, 'value' => 0];
        }

        if ($dateCol) {
            $fCol = getExistingCol($pdo, 'transactions', ['fulfillment_type', 'delivery_type', 'type']);
            $fColQuery = $fCol ? "LOWER(TRIM(`$fCol`))" : "'delivery'";
            $rows = $pdo->query("
                SELECT DATE_FORMAT(`$dateCol`, '%b') AS m_name, $fColQuery AS f_type, COUNT(*) AS total
                FROM transactions WHERE YEAR(`$dateCol`) = '$selectedYear' GROUP BY m_name, f_type
            ")->fetchAll(PDO::FETCH_ASSOC);

            foreach ($rows as $r) {
                $m = $r['m_name'];
                if (isset($fulfillmentBuckets[$m])) {
                    if (strpos($r['f_type'], 'pick') !== false) {
                        $fulfillmentBuckets[$m]['pickup'] += (int)$r['total'];
                    } else {
                        $fulfillmentBuckets[$m]['delivery'] += (int)$r['total'];
                    }
                }
            }
        }

        if ($userDateCol) {
            $userRows = $pdo->query("
                SELECT DATE_FORMAT(`$userDateCol`, '%b') AS m_name, COUNT(*) AS total
                FROM users 
                WHERE YEAR(`$userDateCol`) = '$selectedYear'
                  AND (LOWER(TRIM(role)) IN ('customer', 'user', 'client') OR LOWER(TRIM(role)) NOT IN ('admin', 'administrator', 'employee'))
                GROUP BY m_name
            ")->fetchAll(PDO::FETCH_ASSOC);

            foreach ($userRows as $ur) {
                $m = $ur['m_name'];
                if (isset($customerBuckets[$m])) {
                    $customerBuckets[$m]['value'] += (int)$ur['total'];
                }
            }
        }

        $dateFilterWhere = "YEAR(t.`$dateCol`) = '$selectedYear'";
    } else if ($timeframe === 'weekly') {
        $weeks = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5'];
        foreach ($weeks as $w) {
            $fulfillmentBuckets[$w] = ['label' => $w, 'delivery' => 0, 'pickup' => 0];
            $customerBuckets[$w]    = ['label' => $w, 'value' => 0];
        }

        if ($dateCol) {
            $fCol = getExistingCol($pdo, 'transactions', ['fulfillment_type', 'delivery_type', 'type']);
            $fColQuery = $fCol ? "LOWER(TRIM(`$fCol`))" : "'delivery'";
            $rows = $pdo->query("
                SELECT DAYOFMONTH(`$dateCol`) AS day_num, $fColQuery AS f_type, COUNT(*) AS total
                FROM transactions WHERE DATE_FORMAT(`$dateCol`, '%Y-%m') = '$selectedMonth' GROUP BY day_num, f_type
            ")->fetchAll(PDO::FETCH_ASSOC);

            foreach ($rows as $r) {
                $weekIdx = min(4, (int)floor(((int)$r['day_num'] - 1) / 7));
                $wKey = $weeks[$weekIdx];
                if (strpos($r['f_type'], 'pick') !== false) {
                    $fulfillmentBuckets[$wKey]['pickup'] += (int)$r['total'];
                } else {
                    $fulfillmentBuckets[$wKey]['delivery'] += (int)$r['total'];
                }
            }
        }

        if ($userDateCol) {
            $userRows = $pdo->query("
                SELECT DAYOFMONTH(`$userDateCol`) AS day_num, COUNT(*) AS total
                FROM users 
                WHERE DATE_FORMAT(`$userDateCol`, '%Y-%m') = '$selectedMonth'
                  AND (LOWER(TRIM(role)) IN ('customer', 'user', 'client') OR LOWER(TRIM(role)) NOT IN ('admin', 'administrator', 'employee'))
                GROUP BY day_num
            ")->fetchAll(PDO::FETCH_ASSOC);

            foreach ($userRows as $ur) {
                $weekIdx = min(4, (int)floor(((int)$ur['day_num'] - 1) / 7));
                $wKey = $weeks[$weekIdx];
                $customerBuckets[$wKey]['value'] += (int)$ur['total'];
            }
        }

        $dateFilterWhere = "DATE_FORMAT(t.`$dateCol`, '%Y-%m') = '$selectedMonth'";
    } else {
        // Daily View
        $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        foreach ($days as $d) {
            $fulfillmentBuckets[$d] = ['label' => $d, 'delivery' => 0, 'pickup' => 0];
            $customerBuckets[$d]    = ['label' => $d, 'value' => 0];
        }

        if ($dateCol) {
            $fCol = getExistingCol($pdo, 'transactions', ['fulfillment_type', 'delivery_type', 'type']);
            $fColQuery = $fCol ? "LOWER(TRIM(`$fCol`))" : "'delivery'";
            $rows = $pdo->query("
                SELECT DATE_FORMAT(`$dateCol`, '%a') AS d_name, $fColQuery AS f_type, COUNT(*) AS total
                FROM transactions WHERE DATE_FORMAT(`$dateCol`, '%Y-%m') = '$selectedMonth' GROUP BY d_name, f_type
            ")->fetchAll(PDO::FETCH_ASSOC);

            foreach ($rows as $r) {
                $d = $r['d_name'];
                if (isset($fulfillmentBuckets[$d])) {
                    if (strpos($r['f_type'], 'pick') !== false) {
                        $fulfillmentBuckets[$d]['pickup'] += (int)$r['total'];
                    } else {
                        $fulfillmentBuckets[$d]['delivery'] += (int)$r['total'];
                    }
                }
            }
        }

        if ($userDateCol) {
            $userRows = $pdo->query("
                SELECT DATE_FORMAT(`$userDateCol`, '%a') AS d_name, COUNT(*) AS total
                FROM users 
                WHERE DATE_FORMAT(`$userDateCol`, '%Y-%m') = '$selectedMonth'
                  AND (LOWER(TRIM(role)) IN ('customer', 'user', 'client') OR LOWER(TRIM(role)) NOT IN ('admin', 'administrator', 'employee'))
                GROUP BY d_name
            ")->fetchAll(PDO::FETCH_ASSOC);

            foreach ($userRows as $ur) {
                $d = $ur['d_name'];
                if (isset($customerBuckets[$d])) {
                    $customerBuckets[$d]['value'] += (int)$ur['total'];
                }
            }
        }

        $dateFilterWhere = "DATE_FORMAT(t.`$dateCol`, '%Y-%m') = '$selectedMonth'";
    }

    // --- VIEW B: CATEGORIES (CONDITIONAL AGGREGATION FOR STRICT DATE CALENDAR REACTIVITY) ---
    $categoryData = [];
    try {
        if ($priceCol && $dateCol && $tTxnIdCol && $tiTxnIdCol) {
            $categoryData = $pdo->query("
                SELECT 
                    c.name AS label,
                    COALESCE(ROUND(SUM(
                        CASE WHEN t.`$tTxnIdCol` IS NOT NULL THEN ti.quantity * ti.`$priceCol` ELSE 0 END
                    ), 2), 0.00) AS value
                FROM categories c
                LEFT JOIN products p ON c.category_id = p.category_id
                LEFT JOIN transaction_items ti ON p.product_id = ti.product_id
                LEFT JOIN transactions t ON ti.`$tiTxnIdCol` = t.`$tTxnIdCol` 
                    AND $dateFilterWhere 
                    AND LOWER(TRIM(t.order_status)) NOT IN ('cancelled', 'canceled')
                GROUP BY c.category_id, c.name
                ORDER BY value DESC
                LIMIT 5
            ")->fetchAll(PDO::FETCH_ASSOC);
        }
    } catch (Exception $e) {
    }

    // --- VIEW C: TOP SELLING PRODUCTS (STRICT DATE CALENDAR REACTIVITY) ---
    $productData = [];
    try {
        if ($dateCol && $tTxnIdCol && $tiTxnIdCol) {
            $productData = $pdo->query("
                SELECT 
                    p.name AS label,
                    COALESCE(SUM(
                        CASE WHEN t.`$tTxnIdCol` IS NOT NULL THEN ti.quantity ELSE 0 END
                    ), 0) AS value
                FROM products p
                LEFT JOIN transaction_items ti ON p.product_id = ti.product_id
                LEFT JOIN transactions t ON ti.`$tiTxnIdCol` = t.`$tTxnIdCol` 
                    AND $dateFilterWhere 
                    AND LOWER(TRIM(t.order_status)) NOT IN ('cancelled', 'canceled')
                GROUP BY p.product_id, p.name
                ORDER BY value DESC
                LIMIT 5
            ")->fetchAll(PDO::FETCH_ASSOC);
        }
    } catch (Exception $e) {
    }


    // --- 4. LIST WIDGETS ---
    $expiringGoods = $pdo->query("
        SELECT 
            CONCAT('#CM980', sb.batch_id) AS id,
            p.name AS item,
            DATE_FORMAT(sb.expiry_date, '%b %d') AS extra
        FROM stock_batches sb
        JOIN products p ON sb.product_id = p.product_id
        WHERE sb.expiry_date IS NOT NULL
        ORDER BY sb.expiry_date ASC LIMIT 5
    ")->fetchAll(PDO::FETCH_ASSOC);

    $lowStock = $pdo->query("
        SELECT 
            CONCAT('#CM980', p.product_id) AS id,
            p.name AS item,
            COALESCE(SUM(sb.quantity_remaining), 0) AS extra
        FROM products p
        LEFT JOIN stock_batches sb ON p.product_id = sb.product_id
        GROUP BY p.product_id, p.name ORDER BY extra ASC LIMIT 5
    ")->fetchAll(PDO::FETCH_ASSOC);


    // PAYLOAD OUTPUT
    echo json_encode([
        "success" => true,
        "timeframe" => $timeframe,
        "selectedMonth" => $selectedMonth,
        "selectedYear" => $selectedYear,
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
                "unpaidAmount" => "$" . number_format(max(0, $expectedRev - $realRev), 2)
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
