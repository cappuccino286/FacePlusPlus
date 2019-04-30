var express = require('express');
var router = express.Router();
var request = require('request');
var multer = require('multer');
const storage = multer.memoryStorage();
const { createCanvas, loadImage } = require('canvas');
var upload = multer({ dest: './uploads', storage: storage });

const URL = "https://api-us.faceplusplus.com/facepp/v3/compare";
const API_KEY = "N6XmyTUrxjI5Q6TBIqiIjx7FIlHSPIJJ";
const API_SECRET = "uikapL6u72QPPnK23JNbEVwF7SYlOfU8";
// const HEADERS = {
//    'Content-Type': "application/x-www-form-urlencoded",
//    "X-RapidAPI-Host": "faceplusplus-faceplusplus.p.rapidapi.com",
//    "X-RapidAPI-Key": "32b922efb4msh6cbcd9ae7090e69p1cac76jsn8d165c7ddb46"
// };
// const RETURN_ATTRIBUTES = "gender,age,emotion,skinstatus";
const CANVAS_COLOR = '#28a745';
router.get('/', function (req, res, next) {
   res.render('face-detection');
});

router.post('/', function (req, res) {
   var image_url1 = req.body.image_url1;
   var image_url2 = req.body.image_url2;
   request.post({
      url: URL,
      form: { image_url1: image_url1, image_url2: image_url2, api_key: API_KEY, api_secret: API_SECRET }
   }, async function (err, response, body) {
      console.log("body: "+ body);
      if (response.statusCode == 200) {
         var body = JSON.parse(body);
         var confidence = body.confidence;
         var faces1 = body.faces1;
         var faces2 = body.faces2;
         var image1 = await loadImage(image_url1);
         var new_img1 = hightlightFaces(faces1,image1);
         var image2 = await loadImage(image_url2);
         var new_img2 = hightlightFaces(faces2,image2);
         res.render('face-comparing', { new_img1: new_img1, new_img2: new_img2, confidence: confidence });
      } else {
         req.flash('statusCode', response && response.statusCode);
         req.flash('error', body.error_message);
         res.redirect('/index');
      }
   });
});
function hightlightFaces(faces,image) {
   const canvas = createCanvas(image.width, image.height)
   const context = canvas.getContext('2d');
   context.drawImage(image, 0, 0, image.width, image.height)
   // Now draw boxes around all the faces

   context.strokeStyle = CANVAS_COLOR;

   faces.forEach((face, i) => {
      context.lineWidth = '5';
      var face_rectangle = face.face_rectangle;
      context.beginPath();
      let origX = face_rectangle.left;
      let origY = face_rectangle.top;
      context.lineTo(origX, origY);
      context.lineTo(origX + face_rectangle.width, origY);
      context.lineTo(origX + face_rectangle.width, origY + face_rectangle.height);
      context.lineTo(origX, origY + face_rectangle.height);
      context.lineTo(origX, origY);

      // Text zone
      var textWidth = 80;
      var textHeight = 30;
      context.font = '20px Impact';
      context.fillStyle = CANVAS_COLOR;
      
      context.fillRect(origX+30, origY + face_rectangle.height+30, textWidth, textHeight);
      
      var strFace = "Face " +(i+1);
      context.fillStyle = "#FFF";
      context.textAlign = "center";
      context.fillText(strFace, origX+30+textWidth/2, origY + face_rectangle.height+40+textHeight/2);
      context.stroke();

      context.lineWidth = '2';
      context.moveTo(origX, origY + face_rectangle.height);
      context.lineTo(origX+30, origY + face_rectangle.height+textHeight);
      context.stroke();
   });
   // const fs = require('fs');
   // console.log(image);
   // console.log(__dirname);
   // const out = fs.createWriteStream(__dirname + '/test.png')
   // const stream = canvas.createPNGStream();
   // stream.pipe(out);
   // out.on('finish', () =>  console.log('The PNG file was created.'))
   return canvas.toDataURL();
}
module.exports = router;
