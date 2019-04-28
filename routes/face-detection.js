var express = require('express');
var router = express.Router();
var request = require('request');

router.get('/', function(req, res, next) {
  res.render('face-detection');
});

router.post('/',function(req,res){
  var url =  "https://faceplusplus-faceplusplus.p.rapidapi.com/facepp/v3/detect?return_attributes=gender%2Cage%2Cskinstatus%2Cemotion&image_url=";
  var image_url = req.body.image_url;
  request.post({
     url: url+image_url,
     headers:{
        'Content-Type':"application/x-www-form-urlencoded",
        "X-RapidAPI-Host":"faceplusplus-faceplusplus.p.rapidapi.com",
        "X-RapidAPI-Key":"32b922efb4msh6cbcd9ae7090e69p1cac76jsn8d165c7ddb46"
     }
  }, function (err, response, body) {
     var body = JSON.parse(body);
     if(response.statusCode == 200){
        //Canvas
        const { loadImage } = require('canvas')
        const Canvas = require('canvas');
        loadImage(image_url).then((image) => {
           const canvas = new Canvas.Canvas(image.width, image.height)
           const context = canvas.getContext('2d');
           context.drawImage(image, 0, 0, image.width, image.height)
           // Now draw boxes around all the faces
           
           context.strokeStyle = 'rgba(0,255,0,0.8)';
           context.lineWidth = '5';

           var faces = body.faces;
           faces.forEach((face,i)=>{
              var face_rectangle = face.face_rectangle;
              context.beginPath();
              let origX = face_rectangle.left;
              let origY = face_rectangle.top;
              context.lineTo(origX, origY);
              context.lineTo(origX+face_rectangle.width, origY);
              context.lineTo(origX+face_rectangle.width, origY+face_rectangle.height);
              context.lineTo(origX, origY+face_rectangle.height);
              context.lineTo(origX, origY);
              context.stroke();
           });
           var new_img = canvas.toDataURL();
           res.render('face-detection', { url_img: image_url, new_img: new_img, faces: faces });
        });
     } else {
        req.flash('statusCode', response && response.statusCode);
        req.flash('error', body.error_message);
        res.render('index');
     }
  });
});
module.exports = router;
