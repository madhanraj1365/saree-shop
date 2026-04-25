const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

cloudinary.config({
  cloud_name: 'dwgkl7mg3',
  api_key: '916215241244223',
  api_secret: 'UBXyKgLCqASuZZHcRnsbxIwxZLc',
  secure: true,
});

async function upload() {
  const images = [
    { name: 'mint-green-pattu', path: 'C:\\Users\\Madhanraj\\.gemini\\antigravity\\brain\\48e34ab9-c368-4e43-a0f1-909d7320f89e\\media__1776800948902.jpg' },
    { name: 'ivory-pattu', path: 'C:\\Users\\Madhanraj\\.gemini\\antigravity\\brain\\48e34ab9-c368-4e43-a0f1-909d7320f89e\\media__1776800948874.jpg' },
    { name: 'grey-blue-pattu', path: 'C:\\Users\\Madhanraj\\.gemini\\antigravity\\brain\\48e34ab9-c368-4e43-a0f1-909d7320f89e\\media__1776800948889.jpg' }
  ];

  for (const img of images) {
    try {
      console.log(`Uploading ${img.name}...`);
      const result = await cloudinary.uploader.upload(img.path, {
        folder: 'saree-shop/pattu',
        public_id: img.name,
      });
      console.log(`${img.name} -> ${result.secure_url}`);
    } catch (e) {
      console.error(e);
    }
  }
}

upload();
