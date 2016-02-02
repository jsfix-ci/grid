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

$sth = $connection->query("select count(id) as rowsTotal from item");
$sth->setFetchMode(\PDO::FETCH_ASSOC);
$result = $sth->fetch();
$rowsTotal = $result['rowsTotal'];

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

$goodRows = [];
foreach ($sth->fetchAll() as $row) {
	$goodRows[] = [
		$row['id'],
		$row['sku'],
		$row['barcode'],
		$row['altBarcode'],
		$row['mpn'],
		$row['name'],
		$row['stock'],
		5,
		2,
		$row['location'],
		$row['status'],
		$row['supplier'],
		$row['costPrice'],
		$row['requiresCount'],
		'print me',
		'yes/no'
	];
}

echo json_encode((object) [
	'rowsTotal' => $rowsTotal,
	'pageCurrent' => 1,
	'rowsPerPage' => 10,
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
