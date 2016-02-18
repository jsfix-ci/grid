<?php

$connection = include '../connection.php';

$sql = ["select * from item"];

if (isset($_GET['search']) && is_array($_GET['search'])) {
    $sql[] = 'where';
    $sqlSearches = [];
    foreach ($_GET['search'] as $key => $value) {
        $sqlSearches[] = "$key like '%$value%'";
    }
    $sql[] = implode(' and ', $sqlSearches);
}

if (isset($_GET['order']) && is_array($_GET['order'])) {
    $sql[] = 'order by';
    $sqlOrders = [];
    foreach ($_GET['order'] as $key => $value) {
        $sqlOrders[] = "$key $value";
    }
    $sql[] = implode(', ', $sqlOrders);
}

$sth = $connection->query(implode(' ', $sql));

$rowsTotal = $sth->rowCount();

// limit
$rowsPerPage = $_GET['rowsPerPage'];
$pageCurrent = $_GET['pageCurrent'];
$start = $rowsPerPage * ($pageCurrent - 1);
$finish = ($rowsPerPage * $pageCurrent);

$sql[] = "limit $start, $finish";
$query = $this->db->query(implode(' ', $sql));
$rows = $this->db->get_all_rows($query);

$goodRows = [];
foreach ($rows as $row) {
    $goodRows[] = [
        $row['id'],
        $row['sku'],
        $row['barcode']
    ];
}

echo json_encode((object) [
    'rowsTotal' => $rowsTotal,
    'rows' => $goodRows
]);
