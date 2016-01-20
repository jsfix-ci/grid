<html>
<head>
	<meta charset="UTF-8">
	<title>Grid</title>
	<link rel="stylesheet" href="asset/common.css">
</head>
<body>
	<div class="js-grid-item-container"></div>
	<div class="js-grid-baby-container"></div>
	<script id="mst-grid" type="x-tmpl-mustache"><?php echo file_get_contents('grid.mst') ?></script>
	<script id="mst-grid-input" type="x-tmpl-mustache"><?php echo file_get_contents('grid-input.mst') ?></script>
	<script id="mst-grid-select" type="x-tmpl-mustache"><?php echo file_get_contents('grid-select.mst') ?></script>
	<script id="mst-grid-rows" type="x-tmpl-mustache"><?php echo file_get_contents('grid-rows.mst') ?></script>
	<script src="asset/common.js"></script>
</body>
</html>
