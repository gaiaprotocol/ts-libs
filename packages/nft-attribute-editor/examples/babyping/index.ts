import { el } from '@webtaku/el';
import { createNftAttributeEditor, NftData } from '../../src';
import parts from './parts.json' assert { type: 'json' };
import keyToFrame from './key-to-frame.json' assert { type: 'json' };
import spritesheet from './spritesheet.json' assert { type: 'json' };
import '../main.css';

const testData: NftData = {
  parts: {
    Background: 'Hills',
    Body: 'Kiki Leafmonkey',
    Eye: 'Eye Shadow R',
    Cheek: 'None',
    Mouth: 'Pink Grin',
    Headwear: 'Snail Hairband 3',
    'Neck Accesorie': 'None',
    Bag: 'Gu Ping 3',
    Shoe: 'Leather Shoes',
    'Wrist Accesorie': 'Flower Beads',
    Item: 'Blue Umbrella',
  },
};

document.body.appendChild(el(
  'ion-app.babyping-view',
  //new BabypingDisplay(testData.parts),
  createNftAttributeEditor({
    partOptions: parts,
    baseData: testData,
    keyToFrame: keyToFrame,
    spritesheet,
    spritesheetImagePath:
      'https://api.matedevdao.workers.dev/babyping/spritesheet/spritesheet.png',
  }).el,
));
