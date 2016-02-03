<?php

$credentials = [
	'database.host' => '',
	'database.port' => '',
	'database.basename' => 'inventory_1',
	'database.username' => 'root',
	'database.password' => '123'
];

$dataSourceName = [
    'mysql:host' => $credentials['database.host'],
    'dbname' => $credentials['database.basename'],
    'charset' => 'utf8'
];

foreach ($dataSourceName as $key => $value) {
    $dataSourceNameStrings[] = $key . '=' . $value;
}

$dataSourceName = implode(';', $dataSourceNameStrings);

$connection = new \PDO(
    $dataSourceName,
    $credentials['database.username'],
    $credentials['database.password']
);
// $connection->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

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

$rows = $sth->fetchAll();
$rowsTotal = count($rows);

// limit
$rowsPerPage = $_GET['rowsPerPage'];
$pageCurrent = $_GET['pageCurrent'];
$start = $rowsPerPage * ($pageCurrent - 1);
$finish = ($rowsPerPage * $pageCurrent);

$rows = array_slice($rows, $start, $rowsPerPage);

$goodRows = [];
foreach ($rows as $row) {
	$goodRows[] = [
		$row['id'],
		$row['sku'],
		$row['name'],
		$row['stock'],
		$row['status'],
		$row['supplier'],
		$row['requiresCount'],
		'print html'
	];
}

echo json_encode((object) [
	'rowsTotal' => $rowsTotal,
	'rows' => $goodRows
]);

// id
// sku
// barcode
// altBarcode
// mpn
// name
// stock
// alocStock
// minStock
// location
// status
// supplier
// costPrice
// requiresCount
// print
// composite
