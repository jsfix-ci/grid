<?php

$id = isset($_GET['id']) ? $_GET['id'] : 0;

$connection = include '../connection.php';

$sql = ["delete from item where id = $id"];
$sth = $connection->query(implode(' ', $sql));

echo json_encode((object) [
    'rowCount' => $sth ? $sth->rowCount() : null
]);
