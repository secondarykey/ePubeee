var zip = null;
var gblDataDir = "";

//目次がクリックされたら対応するページを表示 
function view(url){
	
   var frameNode = document.getElementById("bookFrame");
   console.log(frameNode);

   var text  = getEPubData(url);
   var xhtml = Utf8.decode(text);
   var dom   = changeDom(xhtml);

   //画像の展開
   var imgTags = dom.getElementsByTagName("img");
   for ( var cnt = 0; cnt < imgTags.length; ++cnt ) {
	   var imgTag = imgTags[cnt];
	   var imgFileName = imgTag.getAttribute("src");

	   var imgData = getImage(imgFileName);
	   imgTag.src = imgData;
   }

   //cssの読み込み
   var linkTags = dom.getElementsByTagName("link");
   for ( var cnt = 0; cnt < linkTags.length; ++cnt ) {
	   var linkTag = linkTags[cnt];
	   var cssFileName = linkTag.getAttribute("href");
	   var cssFileData = getEPubData(cssFileName);

	   //現在のHTMLに適用
	   var styleTag = document.createElement("style");
	   var cssData = document.createTextNode(cssFileData);
	   styleTag.appendChild(cssData);
	   var parent = linkTag.parentElement;
	   parent.appendChild(styleTag);

	   //リンクタグは削除
	   linkTag.parentElement.removeChild(linkTag);
   }

   var serializer = new XMLSerializer();
   var newXhtml = serializer.serializeToString(dom);
  
   //frameNode.contentDocument = dom;
   //frameNode.contentDocument.body.innrHTML = newXhtml;
 
   frameNode.contentWindow.document.body.innerHTML = newXhtml;

   $("#manifestDialog").dialog('close');
} 

//展開したデータをファイル名から取得
function getEPubData(fileName) {
  return zip.files[gblDataDir+fileName].inflate();
}

function trim(string){
	var text = string.replace(/^[ 　]*/gim, "").replace(/[ 　]*$/gim, "").replace(/[\n]*$/gim, "").replace(/[\r\n]*$/gim, "");
	return text;
}

function createDom(fileName) {
	var data = zip.files[gblDataDir + fileName].inflate();
	return changeDom(data);
}

function changeDom(data) {
    var xmldom = new DOMParser();
    var dom = xmldom.parseFromString( data, "application/xml" );
	return dom;
}

/**
 * 画像の作成
 * @param mime
 * @param fileName
 * @returns {String}
 */
function getImage(fileName) {

	var ext = "";
    var index = fileName.lastIndexOf(".");
    if ( index != -1 ) {
    	ext = fileName.substring(index + 1);
    }

	var mime = "";
	if ( ext == "gif" ) {
		mime = "image/gif";
	} else if ( ext == "jpg" || ext == "jpeg" ) {
		mime = "image/jpeg";
	} else if ( ext == "png" ) {
		mime = "image/png";
	} else if ( ext == "svg" ) {
		mime = "image/svg-xml";
	} else {
		console.log(fileName);
	}

  var fileData = getEPubData(fileName);

  var prefix = "data:" + mime + ";base64,";
  var enc = base64["encode"]( fileData , false);
  return prefix + enc;
}

function isEPub() {

    var type = zip.files["mimetype"];
    if ( type === undefined ) {
    	return false;
    }

    var val = type.inflate();
    val = trim(val);
    if ( val != "application/epub+zip" ) {
    	return false;
    }

    //container.xmlの解析
    var containerXml = zip.files["META-INF/container.xml"];
    if ( containerXml === undefined ) {
  	  	return false;
    }

    var data = containerXml.inflate();
    var dom = changeDom(data);

    var rootFileTags = dom.getElementsByTagName("rootfile");
    if ( rootFileTags.length != 1 ) {
    	return false;
    }
    var rootFile = rootFileTags[0].getAttribute("full-path");
    if ( rootFile === undefined ) {
  	  	return false;
    }

    var fileName = rootFile;
    var index = rootFile.lastIndexOf("/");
   
    //ディレクトリ指定があった場合
    if ( index != -1 ) {
      fileName = rootFile.substring(index + 1);
      //指定するディレクトリを設定
      gblDataDir = rootFile.substring(0,index + 1);
    }
    
    //抜き出したOPFファイルを設定する
    var xhtmlList = analysisOPF(fileName);

    // 目次を生成 
    var contentsList = "<ul id='menu'>";
    for(var i=0; i<xhtmlList.length; i++){
      contentsList += '<li><a href="#" onclick=view("'+xhtmlList[i]+'")>'+xhtmlList[i]+"</a></li>";
    }

    //メニューに設定
    document.getElementById("menubar").innerHTML = contentsList+"</ul>";

    return true;
}

function openManifestDialog() {
	
	$("#manifestDialog").dialog({
        autoOpen : true,
		position : "center",
		width    : 600,
		height   : 500
	});

}

function openSelectDialog() {
	
	//$("#epubLoader").progressbar({value:0});
	//$('#epubLoader').progressbar('value', ++v);
	
	$("#epubDialog").dialog({
		title    : "EPUBファイルをドラッグ&ドロップできます。",
		modal    : true,
		position : "center",
		width    : 600,
		height   : 500
	});
}

$(document).ready(function() {


	$("#manifestDialog").dialog({
        autoOpen: false
	});
	
  //EPUBファイル指定処理
  $("#epubFile").change(function() {
	
	  $("#epubDialog").dialog('close');
	  //ファイルを変更された場合
	  var fileData = document.getElementById("epubFile").files[0];
	  var reader = new FileReader(); 

	  //読み込みが完了したら
	  reader.onload = function(evt){
          var bytes = [];
          var byteData = evt.target.result;

          //データを変換
          for (var i=0; i<byteData.length; i++) {
        	  bytes[i] = byteData.charCodeAt(i) & 0xff;
          }

          //epubファイルを解凍
          zip = Zip.inflate(bytes);
          if ( !isEPub() ) {
        	  alert("not EPUB");
        	  return;
          }
          //目次を開く
          openManifestDialog();
	  };
	  reader.onerror = function(evt){
		  console.log(evt);
	  };

	  reader.readAsBinaryString(fileData);
  });

  $('#exampleMenu').sweetMenu({
		top: 40,
		padding: 8,
		iconSize: 48,
		easing: 'easeOutBounce',
		duration: 500,
		icons: [
			'images/home.png',
			'images/comments.png',
			'images/red_heart.png',
			'images/male_user.png',
			'images/yellow_mail.png',
			'images/computer.png'
		]
	});
 
    //EPUB 選択用のメニュー
    $('#epubSelect').sweetMenu({
		top: 600,
		padding: 8,
		iconSize: 48,
		easing: 'easeOutBounce',
		duration: 1000,
		icons: [
			'images/epub_logo.gif'
		]
	});

    //EPUB選択を開く
    openSelectDialog();
});

/**
 * OPFファイルを解析して文字列データを作成する
 * @param fileName
 * @returns {Array}
 */
function analysisOPF(fileName){
  //ファイル名からDomを作成 
  var dom = createDom(fileName);
  var fileList = [];
  // EPUB表示に必要なファイル項目を取得
  var itemTag = dom.getElementsByTagName("manifest")[0].getElementsByTagName("item");
  // 表示順を示すitemrefタグを取得
  var indexItem = dom.getElementsByTagName("spine")[0].getElementsByTagName("itemref");

  // ページの表示順番を取得（IDからファイル名を取得）  
  for(var i=0; i<indexItem.length; i++){
    var ID = indexItem[i].getAttribute("idref");
    // IDを読み出す
    for(var j=0; j<itemTag.length; j++){
      var cID = itemTag[j].getAttribute("id");
      // IDを読み出す
      // console.log(ID+" = "+cID);
      // 確認したい人はコメント削除してください 
      if (ID == cID){
        fileList.push(itemTag[j].getAttribute("href"));
        // href属性を読み出す 
        //console.log(itemTag[j].getAttribute("href"));
        // 確認したい人はコメント削除してください
        break; 
        // ループから抜ける 
      }
    }
  }
  return fileList;
}

