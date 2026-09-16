const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const http = require('http');

// Render ke liye web server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h1>🤖 YakMiner99 is Online and Mining!</h1>');
});
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

let bot;
let mcData;
let isMining = false;

function createBot() {
  bot = mineflayer.createBot({
    host: 'play.splivegamer.xyz',
    port: 21799,
    username: 'YakMiner99', // Naya Bot Name
    auth: 'offline',
    version: false,
    checkTimeoutInterval: 60000 
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    console.log('🤖 Bot server me aa gaya hai!');
    
    setTimeout(() => {
      // Naya password aur Register command
      bot.chat('/register totototot555 totototot555'); 
      console.log('✅ Registered / Logged in successfully with new password!');
      setTimeout(startSmartMining, 6000); 
    }, 3000);
    
    mcData = require('minecraft-data')(bot.version);
    const movements = new Movements(bot, mcData);
    movements.canDig = true;
    bot.pathfinder.setMovements(movements);

    startAutoDrop();
    startAutoDelivery();
  });

  async function startSmartMining() {
    isMining = true;
    console.log('🔍 Spawner ki khoj shuru...');

    try {
      while (isMining && bot && bot.entity) {
        const targetIds = [
            mcData.blocksByName['spawner']?.id,
            mcData.blocksByName['mossy_cobblestone']?.id
        ].filter(id => id !== undefined);

        const foundBlocks = bot.findBlocks({ matching: targetIds, maxDistance: 12, count: 1 });

        if (foundBlocks.length > 0) {
          const targetBlock = bot.blockAt(foundBlocks[0]);
          if (targetBlock) {
            console.log(`🎯 Radar me Spawner ya Dungeon mila! Location: ${targetBlock.position}`);
            try {
              await bot.pathfinder.goto(new goals.GoalGetToBlock(targetBlock.position.x, targetBlock.position.y, targetBlock.position.z));
              const pickaxe = bot.inventory.items().find(i => i.name.includes('pickaxe') || i.name.includes('axe'));
              if (pickaxe) await bot.equip(pickaxe, 'hand');
              await delay(2000);
              await bot.dig(targetBlock);
            } catch (err) {}
          }
          await delay(3000);
        } else {
          console.log('⛏️ Safe Strip Mining chal rahi hai...');
          const x = bot.entity.position.x + (Math.random() > 0.5 ? 2 : -2);
          const z = bot.entity.position.z + (Math.random() > 0.5 ? 2 : -2);
          try {
              await bot.pathfinder.goto(new goals.GoalNear(x, bot.entity.position.y, z, 1));
          } catch(e) {
              try {
                const blockInFront = bot.blockAt(bot.entity.position.offset(1, 0, 0));
                if (blockInFront && blockInFront.name !== 'air' && blockInFront.name !== 'bedrock') {
                    const pickaxe = bot.inventory.items().find(i => i.name.includes('pickaxe'));
                    if (pickaxe) await bot.equip(pickaxe, 'hand');
                    await bot.dig(blockInFront);
                }
              } catch(err) {}
          }
          await delay(4000);
        }
      }
    } catch (e) {}
  }

  function startAutoDrop() {
    setInterval(async () => {
      if (!bot || !bot.inventory) return;
      const junkNames = ['dirt', 'cobblestone', 'gravel', 'andesite', 'diorite', 'granite', 'tuff', 'deepslate', 'cobbled_deepslate'];
      for (const item of bot.inventory.items()) {
        if (junkNames.includes(item.name)) {
          try {
            await bot.tossStack(item);
            await delay(1000); 
          } catch (err) {}
        }
      }
    }, 150000); 
  }

  function startAutoDelivery() {
    setInterval(async () => {
      try {
        if (!bot || !bot.inventory) return;
        const spawnerItem = bot.inventory.items().find(item => item.name.includes('spawner'));
        const isUserOnline = bot.players['.ADITYAFF3309'];

        if (spawnerItem && isUserOnline) {
          console.log('✅ .ADITYAFF3309 online hai! Spawner dene ke liye TPA bhej raha hu...');
          bot.chat('/tpa .ADITYAFF3309');
          await delay(12000); 
          const itemsToDrop = bot.inventory.items().filter(item => item.name.includes('spawner'));
          for (let item of itemsToDrop) {
              await bot.tossStack(item);
              await delay(500);
          }
          console.log('🎁 Spawner successfully deliver kar diya!');
        }
      } catch (e) {}
    }, 70000); 
  }

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  bot.on('end', () => {
    console.log('🔴 Disconnected. Reconnecting in 15s...');
    isMining = false;
    setTimeout(createBot, 15000);
  });

  bot.on('error', (err) => {
    console.log('⚠️ Bot Warning:', err.message || err);
  });
}

createBot();
