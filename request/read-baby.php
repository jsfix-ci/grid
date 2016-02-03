<?php

// here get doctrine instance and create query based on the request given then return rows, page number, limit

// echo '<pre>';
// print_r($_REQUEST);
// echo '</pre>';
// exit;

$rows = [
		[1, 2, 3],
		[1, 2, 3],
		[1, 2, 3],
		[1, 2, 3],
		[1, 2, 3],
		[1, 2, 3]
	];

echo json_encode((object) [
	'rowsTotal' => count($rows), 
	'rows' => $rows
]);
