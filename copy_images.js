const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'public', 'images', 'hero');
fs.mkdirSync(targetDir, { recursive: true });

const images = [
  { src: 'C:/Users/Muhammad/.gemini/antigravity-ide/brain/168e7728-1c85-4e56-8118-0843385fa6d8/hero_slide_1_plumber_1785410458400.png', dest: 'hero-1-plumber.png' },
  { src: 'C:/Users/Muhammad/.gemini/antigravity-ide/brain/168e7728-1c85-4e56-8118-0843385fa6d8/hero_slide_2_electrician_1785410479663.png', dest: 'hero-2-electrician.png' },
  { src: 'C:/Users/Muhammad/.gemini/antigravity-ide/brain/168e7728-1c85-4e56-8118-0843385fa6d8/hero_slide_3_carpenter_1785410492648.png', dest: 'hero-3-carpenter.png' },
  { src: 'C:/Users/Muhammad/.gemini/antigravity-ide/brain/168e7728-1c85-4e56-8118-0843385fa6d8/hero_slide_4_painter_1785410511394.png', dest: 'hero-4-painter.png' },
  { src: 'C:/Users/Muhammad/.gemini/antigravity-ide/brain/168e7728-1c85-4e56-8118-0843385fa6d8/hero_slide_5_ac_tech_1785410524186.png', dest: 'hero-5-ac-tech.png' },
  { src: 'C:/Users/Muhammad/.gemini/antigravity-ide/brain/168e7728-1c85-4e56-8118-0843385fa6d8/hero_slide_6_cleaner_1785410537336.png', dest: 'hero-6-cleaner.png' }
];

images.forEach(img => {
  if (fs.existsSync(img.src)) {
    fs.copyFileSync(img.src, path.join(targetDir, img.dest));
    console.log(`Successfully copied ${img.dest}`);
  } else {
    console.error(`Source image not found: ${img.src}`);
  }
});
