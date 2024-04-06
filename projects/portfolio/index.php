
	<!DOCTYPE html>
	<html>

		<head>
			<meta http-equiv="Cache-Control" content="no-cache" />
			<meta http-equiv="Pragma" content="no-cache" />
			<meta http-equiv="Expires" content="0" />
			<title>Site 1</title>
			<script src='./globals.js' type="text/javascript"></script>
			<script src='./index.js' type="text/javascript" defer></script>
			<script src='./model/build.js' type="text/javascript"></script>
			<script src='./controller/navExtra.js' type="text/javascript"></script>
			<link rel="stylesheet/less" type="text/css" href="/view/style/index.less" />
			<script src="https://cdn.jsdelivr.net/npm/less" ></script>
		</head>

		<body>
		
			<div id="#Sh" class="popupWindow preloader">
				<!--This is inintial preloader-->
				<div class="wrapper">
					<figure>
						<img src="./view/other/loader/219.svg">
					</figure>
				</div>
			</div>

			<section  class="content" ref="mainContent">
				<header ref="mainHead"></header>
				<main   ref="mainBody"></main>
				<footer ref="mainFoot"></footer>
			</section>
		</body>

	</html>
