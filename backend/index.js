import express from "express";
import fetch from 'node-fetch';
import cors from 'cors';
import imageToBase64 from 'image-to-base64';

const PORT = process.argv.length > 2 ? Number(process.argv[2]) : 8004;
const app = express();
const HYPIXELENDPOINT = 'https://api.hypixel.net';
const HYPIXELKEY = 'PUTYOURKEYHERE';

app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/user', async (req, res) => {
  const username = req.query.username;
  // Check username isnt empty
  if (username == undefined || username.length === 0) {
    res.status(400).send();
    return;
  }
  // Get uuid
  const resp = await fetch(
    `https://api.mojang.com/users/profiles/minecraft/${username}`);
  if (resp.status !== 200) {
    res.status(404).send("Cannot find user");
    return;
  }
  const rJson = await resp.json();
  const uuid = rJson.id;
  // Get skin
  const skinResp = await fetch(
    `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`
  )
  if (skinResp.status !== 200) {
    res.status(404).send("Cannot find skin");
    return;
  }
  const skinRespJson = await skinResp.json();
  console.log(skinRespJson);
  const skinJsonDecoded = JSON.parse(
    Buffer.from(skinRespJson.properties[0].value, 'base64').toString());
  console.log(skinJsonDecoded);
  const base64skin = await imageToBase64(skinJsonDecoded.textures.SKIN.url);
  const headers = {
    "Content-Type": "application/json",
    "API-Key": HYPIXELKEY
  };
  // Get hypixel data
  const hypixelResp = await fetch(`${HYPIXELENDPOINT}/recentgames?uuid=${uuid}`, {headers, });
  const hypixelJson = await hypixelResp.json();
  
  const output = {
    username: username.toLowerCase(),
    skin: base64skin,
    games: hypixelJson.games,
    hypixel: hypixelJson,
  }
  res.send(output);
})

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})
