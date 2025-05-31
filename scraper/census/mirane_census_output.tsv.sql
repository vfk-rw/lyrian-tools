DROP TABLE IF EXISTS census_character_classes CASCADE;
DROP TABLE IF EXISTS census_classes CASCADE;
DROP TABLE IF EXISTS census_characters CASCADE;
CREATE TABLE census_classes(id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, tier INT NOT NULL);
CREATE TABLE census_characters(id SERIAL PRIMARY KEY, created_at TIMESTAMP NOT NULL DEFAULT now(), player_name TEXT, adventurer_name TEXT, adventurer_url TEXT, spirit_core_current INT, race TEXT, sub_race TEXT, expedition_departure DATE, expedition_return DATE, ip_lockout_end DATE);
CREATE TABLE census_character_classes(character_id INT REFERENCES census_characters(id), class_id INT REFERENCES census_classes(id), PRIMARY KEY(character_id, class_id));

-- insert census_classes
INSERT INTO census_classes(name,tier) VALUES('Acolyte',1);
INSERT INTO census_classes(name,tier) VALUES('Adventurer',1);
INSERT INTO census_classes(name,tier) VALUES('Aetherie',2);
INSERT INTO census_classes(name,tier) VALUES('Alchemeister',2);
INSERT INTO census_classes(name,tier) VALUES('Alchemist',1);
INSERT INTO census_classes(name,tier) VALUES('Alkahest',2);
INSERT INTO census_classes(name,tier) VALUES('Animal Summoner',2);
INSERT INTO census_classes(name,tier) VALUES('Archer',2);
INSERT INTO census_classes(name,tier) VALUES('Bard',2);
INSERT INTO census_classes(name,tier) VALUES('Battle Mage',2);
INSERT INTO census_classes(name,tier) VALUES('Berserker',2);
INSERT INTO census_classes(name,tier) VALUES('Blacksmith',1);
INSERT INTO census_classes(name,tier) VALUES('Bloodbinder',2);
INSERT INTO census_classes(name,tier) VALUES('Carpenter',1);
INSERT INTO census_classes(name,tier) VALUES('Cavalier',1);
INSERT INTO census_classes(name,tier) VALUES('Chronomancer',2);
INSERT INTO census_classes(name,tier) VALUES('Cryomancer',2);
INSERT INTO census_classes(name,tier) VALUES('Curse Knight',2);
INSERT INTO census_classes(name,tier) VALUES('Electromancer',2);
INSERT INTO census_classes(name,tier) VALUES('Faerie Light Eyes',2);
INSERT INTO census_classes(name,tier) VALUES('Farmer',1);
INSERT INTO census_classes(name,tier) VALUES('Fighter',1);
INSERT INTO census_classes(name,tier) VALUES('Flash Star Blade Style',2);
INSERT INTO census_classes(name,tier) VALUES('Forager',1);
INSERT INTO census_classes(name,tier) VALUES('Forgemaster',2);
INSERT INTO census_classes(name,tier) VALUES('Geomancer',2);
INSERT INTO census_classes(name,tier) VALUES('Guardian',2);
INSERT INTO census_classes(name,tier) VALUES('Gunslinger',2);
INSERT INTO census_classes(name,tier) VALUES('Hussar',2);
INSERT INTO census_classes(name,tier) VALUES('Iaido Style',2);
INSERT INTO census_classes(name,tier) VALUES('Lancer',2);
INSERT INTO census_classes(name,tier) VALUES('Mage',1);
INSERT INTO census_classes(name,tier) VALUES('Marksman',2);
INSERT INTO census_classes(name,tier) VALUES('Martial Artist',1);
INSERT INTO census_classes(name,tier) VALUES('Miner',1);
INSERT INTO census_classes(name,tier) VALUES('Monk',2);
INSERT INTO census_classes(name,tier) VALUES('Necromancer',2);
INSERT INTO census_classes(name,tier) VALUES('Ninja',2);
INSERT INTO census_classes(name,tier) VALUES('Onmyoji',2);
INSERT INTO census_classes(name,tier) VALUES('Oracle',2);
INSERT INTO census_classes(name,tier) VALUES('Priest',2);
INSERT INTO census_classes(name,tier) VALUES('Pyromancer',2);
INSERT INTO census_classes(name,tier) VALUES('Ranger',1);
INSERT INTO census_classes(name,tier) VALUES('Rogue',1);
INSERT INTO census_classes(name,tier) VALUES('Saboteur',2);
INSERT INTO census_classes(name,tier) VALUES('Shadow Thief',2);
INSERT INTO census_classes(name,tier) VALUES('Shield Paladin',2);
INSERT INTO census_classes(name,tier) VALUES('Shieldwarden',2);
INSERT INTO census_classes(name,tier) VALUES('Spellblade',2);
INSERT INTO census_classes(name,tier) VALUES('Summoner',3);
INSERT INTO census_classes(name,tier) VALUES('Sword Paladin',2);
INSERT INTO census_classes(name,tier) VALUES('Thief',2);
INSERT INTO census_classes(name,tier) VALUES('Timberwright',2);
INSERT INTO census_classes(name,tier) VALUES('Time Thief',2);
INSERT INTO census_classes(name,tier) VALUES('Transmuter',1);
INSERT INTO census_classes(name,tier) VALUES('Wave Palm Style',2);
INSERT INTO census_classes(name,tier) VALUES('Windbringer',2);

-- insert characters and relationships
-- row 1
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('AShyMoth','Nia Prys','https://docs.google.com/spreadsheets/d/1qb04pLDsZNuq50Sq-tDp2sUJpRIi5afb/edit?usp=sharing&ouid=106887388069059291818&rtpof=true&sd=true',1645,'Chimera','Phoenix',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Mage','Onmyoji','Pyromancer');
-- row 2
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Sabbrewolf','Ash Avernus','https://docs.google.com/spreadsheets/d/1ojX3sOukLoDXhOyUPabbprUQRNBciDra/edit?usp=sharing&ouid=108812373200107551665&rtpof=true&sd=true',1900,'Fae','Salamander',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Fighter','Blacksmith','Forgemaster');
-- row 3
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Teraval','Teraval Pinecone','https://docs.google.com/spreadsheets/d/1OAo0nb-a4Gi-oCY4gYOWqhOUsuPYArMs/edit?usp=sharing&ouid=102568176268617888070&rtpof=true&sd=true',1515,'Fae','Pixie',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Acolyte','Faerie Light Eyes','Priest');
-- row 4
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Wizard of Poop','Woop','https://docs.google.com/spreadsheets/d/1lnh239BRRX4YFt2ltThsAPHjQSAIPQSH/edit?usp=sharing&ouid=112716252140882953803&rtpof=true&sd=true',1515,'Human','Light',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Mage','Ranger','Acolyte');
-- row 5
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Beetle Swallower','Beetle Swallower','https://docs.google.com/spreadsheets/d/12kjQvC2vCo7Zym4zb8uU9zkZJ1916ejj/edit?usp=sharing&ouid=112970099103478293972&rtpof=true&sd=true',1600,'Human','Divine Protection',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Curse Knight','Necromancer','Summoner','Berserker');
-- row 6
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('UnluckySloth','Marcus Wi Dalen','https://docs.google.com/spreadsheets/d/1yKhTGvSvMDE569LG621mA91FMUXz2L7z/edit?usp=sharing&ouid=117534912672684778244&rtpof=true&sd=true',1330,'Demon','Wi',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Ranger','Rogue','Saboteur');
-- row 7
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Jay Spicer (Jack)','Jack','https://docs.google.com/spreadsheets/d/1W9Recbod6VIKgXjvor54IdeV65mzblbx/edit?usp=sharing&ouid=101021334597903651840&rtpof=true&sd=true',1390,'Demon','Lir',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Ranger','Rogue','Martial Artist');
-- row 8
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('GreenWold1337','Jerrick Blackoak','https://docs.google.com/spreadsheets/d/1FY9_gdEY2so2qChvEg3j8zfUmL_aNPjD/edit?usp=sharing&ouid=113867861088983561172&rtpof=true&sd=true',1000,'Chimera','Wolf-folk',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Fighter','Sword Paladin');
-- row 9
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('"Don" Bon Hopkins','"Don" Bon Hopkins','https://docs.google.com/spreadsheets/d/1JnCGIzLzcO-iQEmMhHdfxNwKGZWWiHA5pp4g-tAlCsg/edit?usp=sharing',1800,'Chimera','Rabbitfolk',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Fighter');
-- row 10
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Vera V, Vermouth','Vera Vermillion Vermouth','https://docs.google.com/spreadsheets/d/13Gl7ritslRWhT0enMcVx5_0VMOg4Zoiv/edit?gid=1997331408#gid=1997331408',1000,'Fae','Pixie',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Rogue','Faerie Light Eyes');
-- row 11
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Cali Bell (Feyrod)','Calia Bell','https://docs.google.com/spreadsheets/d/12iLp2YqzT4TEe_pD3jVJrgfBhnRh9KXq/edit?usp=drivesdk&ouid=118431694302210274652&rtpof=true&sd=true',1515,'Chimera','Rabbitfolk','5/12/2025','5/21/2025','5/27/2025') RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Mage','Martial Artist','Rogue','Thief');
-- row 12
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Vim N Vigor','Pádraigín','https://docs.google.com/spreadsheets/d/1GqFLGCo-NuRpn5bmwd_AXZ96fcmmes8K/edit?usp=sharing&ouid=109138423568570624496&rtpof=true&sd=true',1375,'Fae','Gnome',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Rogue','Chronomancer');
-- row 13
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Drogan Helmut','Drogan Helmut','https://docs.google.com/spreadsheets/d/1-QS3C7LX-UCZivvptGanaj1yh27QjlIy/edit?usp=sharing&ouid=104161008957320152258&rtpof=true&sd=true',1500,'Fae','Dullahan','5/1/2025','5/15/2025','5/20/2025') RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Fighter');
-- row 14
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Gein Hemlocke','Gein Hemlock','https://docs.google.com/spreadsheets/d/1CZ51ihYgL3y_LOLqF4hJ5gCur51is2ne/edit?gid=1997331408#gid=1997331408',2045,'Chimera','Slimefolk',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Fighter','Lancer');
-- row 15
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Evenfall (Charre)','Evenfall','https://docs.google.com/spreadsheets/d/1yrDfMcsEzIFWPxEs7zTKxhub-lgLK45A/edit?usp=sharing&ouid=105313069251360998695&rtpof=true&sd=true',1635,'Fae','Willo Wisp',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Rogue','Faerie Light Eyes');
-- row 16
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Ruofei (Ando)','Ruofei','https://docs.google.com/spreadsheets/d/1kUKpaOaprz06bKnSEQLCwPT_DBkZp3qp/edit?usp=sharing&ouid=101529830063024907324&rtpof=true&sd=true',1000,'Chimera','Red Pandafolk',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Martial Artist','Gunslinger');
-- row 17
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Florentino','Voltaire Schild','https://docs.google.com/spreadsheets/d/136ADhP8CtKerL8ZrwP_lDUcAxfbQmG6K/edit?gid=1997331408#gid=1997331408',1100,'Human','Divine Protection',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Acolyte','Fighter','Shield Paladin');
-- row 18
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Ekkehard Adalwolf (Volki)','Ekkehard Adalwolf','https://docs.google.com/spreadsheets/d/1wW4hlXMfdCK_HZak2GiCpHRfPjsr7kqS0V72bK2x45M/edit?usp=sharing',1195,'Chimera','Wolf-folk',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Fighter','Guardian');
-- row 19
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Iru Alfo (Moleren)','Iru Alfo','https://docs.google.com/spreadsheets/d/1_js6-IAvFu_YU0HuvDs4uzQcitRMRXe0/edit?gid=1997331408#gid=1997331408',1890,'Youkai','Ancient Marionette','5/2/2025','5/28/2025','6/3/2025') RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Fighter','Martial Artist','Ranger');
-- row 20
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Buntaoo','Fuyuka Shimo','https://docs.google.com/spreadsheets/d/10Y8V6htFcTfB376VMgNmkd46xQgKCRxZ/edit?usp=sharing&ouid=101088453070518972549&rtpof=true&sd=true',2000,'Youkai','Yuki-onna','5/2/2025','5/28/2025','6/3/2025') RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Acolyte','Cryomancer','Geomancer');
-- row 21
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Zero Terminus (Rue)','Zero Terminus','https://docs.google.com/spreadsheets/d/1mOHejPVdEomUUHq04856H2kMwbiwHIRx/edit?usp=sharing&ouid=102703316609933324765&rtpof=true&sd=true',1665,'Human-Chimera','Phoenix',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Ranger','Rogue','Animal Summoner');
-- row 22
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Phantomxz','Sarah','https://docs.google.com/spreadsheets/d/1u0vbL_gKOOCWjTkPmgZz4hxK5EW5B5t7/edit?gid=1997331408#gid=1997331408',1265,'Chimera','Centaur',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Martial Artist','Rogue','Cavalier');
-- row 23
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Kita Ro-Ro (Azorinth)','Kita Ro-Ro','https://docs.google.com/spreadsheets/d/1u5sb8Qo2yhtxmKVSfUXGllXKyTENJVsO/edit?usp=sharing&ouid=111118343248048018516&rtpof=true&sd=true',1000,'Chimera','Dogfolk',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Fighter','Guardian');
-- row 24
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Shinraku','Shinraku','https://docs.google.com/spreadsheets/d/12uEV4okV3oKZGX_fDZ_obfk32z_GxP0v/edit?gid=1997331408#gid=1997331408',1420,'Youkai','Oni',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Alchemist','Alchemeister');
-- row 25
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Rai (Alkavi)','Rai','https://docs.google.com/spreadsheets/d/1hR86tlPUVYx_Mk1ol1tXb2duFE-L9wv7/edit?usp=sharing&ouid=104187462070454197980&rtpof=true&sd=true',1820,'Youkai','Raijin',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Blacksmith','Fighter','Rogue','Forgemaster');
-- row 26
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Wahaha','Susie','https://docs.google.com/spreadsheets/d/12F862V_Pq84OV3fXpZ3L2P2YM8im5aR9/edit?usp=sharing&ouid=101100012439895691789&rtpof=true&sd=true',1390,'Youkai','Jiangshi',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Alchemist','Necromancer');
-- row 27
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Elise (MyMemories3)','Elise Tamrei','https://docs.google.com/spreadsheets/d/1lbqYOOqu3prZRpoZr5XBjEqu0kHpegcv/edit?gid=1997331408#gid=1997331408',2020,'Fae','Gnome','5/2/2025','5/28/2025','6/3/2025') RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Mage','Faerie Light Eyes');
-- row 28
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Draig','Draig','https://docs.google.com/spreadsheets/d/e/2PACX-1vRVZL1dBAIvyb5IqLj09Cqm3aQcIQsVpwPgEzMAjsqZT2VTjD2ZGBMjUeB5Qx4dIw/pubhtml',2035,'Human-Chimera','Phoenix',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Rogue','Adventurer','Martial Artist','Ninja');
-- row 29
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Icarus','Icarus','https://docs.google.com/spreadsheets/d/1Y0aTSQFeYDxXP_UHadCVMSj2zp8JRh-k9bu7y2Cv9gk/edit?gid=1910447226#gid=1910447226',1640,'Human','Divine Protection','5/1/2025','5/15/2025','5/20/2025') RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Bard','Shieldwarden');
-- row 30
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Dogbert Wallmann','Dogbert Wallmann','https://docs.google.com/spreadsheets/d/1_aykjnSfgBQ2DFp5BtEkd6myvMeq3fgX/edit?gid=1997331408#gid=1997331408',1685,'Human-Chimera','Dogfolk',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Fighter','Shield Paladin');
-- row 31
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Avolthe Ar''Wrynfel (Dylons)','Avolthe Ar''Wrynfel','https://docs.google.com/spreadsheets/d/1EJzIozkUMOtv0ybZjiuF8UkvDRnzkT7U/edit?gid=1997331408#gid=1997331408',2005,'Demon','Ar',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Mage','Bard','Chronomancer');
-- row 32
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Turos Kensei','Leo Barrak','https://docs.google.com/spreadsheets/d/1lxtT1QTmiwZNfoa37l8F3AZASLov5hLn/edit?usp=sharing&ouid=113351362468564061511&rtpof=true&sd=true',1370,'Human','Divine Protection',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Acolyte','Adventurer','Fighter','Forager');
-- row 33
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Zolong Duskblade','Zolong Duskblade','https://docs.google.com/spreadsheets/d/1dM8jz1B3DnmJ3eDO6YVzemt2jY914UeGm1Pc3FZCMPk/edit?usp=sharing',1100,'Fae','High Fae','5/12/2025','5/21/2025','5/27/2025') RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Rogue','Shadow Thief');
-- row 34
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Sinner','"Bunny King" Maxis','https://docs.google.com/spreadsheets/d/1KwsWK0RAa9kVL5hkiYMXg7nCt1c6gyDL/edit?usp=sharing&ouid=107001843366624612417&rtpof=true&sd=true',1505,'Chimera','Rabbitfolk',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Acolyte','Battle Mage','Bloodbinder');
-- row 35
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Maunomau (Noar)','Noar','https://docs.google.com/spreadsheets/d/1v2_6uqWeUTcHBC1oJO93m_gBl_2upLw7/edit?usp=sharing&ouid=100349875529504309833&rtpof=true&sd=true',1400,'Human-Chimera','Dogfolk',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Fighter','Bard','Shield Paladin');
-- row 36
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Alaric Windhill (Taikanarri)','Alaric Windill','https://docs.google.com/spreadsheets/d/1dsOFX7YBZvpinXpqAdO3HBAWW1rzeVtd/edit?usp=sharing&ouid=100411381291678387259&rtpof=true&sd=true',1440,'Human','Divine Protection',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Windbringer','Sword Paladin','Battle Mage');
-- row 37
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Emperor Jerod','Kuzo Yorita','https://docs.google.com/spreadsheets/d/1oTxvH4UBKkpGUzOdmzKU4UfQpDOmSd0x/edit?gid=294044971#gid=294044971',1000,'Youkai','Ancient Marionette',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Mage','Alchemist','Acolyte');
-- row 38
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Vajra (mightygerm)','Vajra','https://docs.google.com/spreadsheets/d/1NQzLD5E7GzUlz7VdABewLZofzPMX-eDP/edit?gid=1997331408#gid=1997331408',1000,'Youkai','Raijin',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Electromancer','Battle Mage');
-- row 39
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Garael Blanchweyld (PeasantKyr)','Garael Blanchweyld','https://docs.google.com/spreadsheets/d/1nZ3btPk5dfXlVl5e3_zzblg7Lsr-OVRuvpPnPq_V5Os/edit?gid=1997331408#gid=1997331408',1325,'Fae','Dullahan',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Fighter','Shieldwarden');
-- row 40
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Lunatic | Roslyn Reinhardt','Roslyn Reinhardt "Ros"','https://docs.google.com/spreadsheets/d/1Uzbpc6dqLzqya-VzJZ_ZRIlifiKnHg_X/edit?usp=sharing&ouid=115465355942803541036&rtpof=true&sd=true',1100,'Human','Divine Protection',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Adventurer','Acolyte','Shield Paladin');
-- row 41
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Florentino','Finia Padfoot','https://docs.google.com/spreadsheets/d/1lvbm1HVZnltWn-BCNd_Rtrkb5TDDhjoC/edit?gid=1997331408#gid=1997331408',1640,'Chimera','Catfolk',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Ranger','Acolyte','Shieldwarden');
-- row 42
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Draco9889','Draco Kyrios','https://docs.google.com/spreadsheets/d/1cepzK9Ozhy__mn3WwtoNaKnMKaVC7Wfx/edit?gid=1997331408#gid=1997331408',1000,'Fae','Salamander',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Fighter','Mage','Adventurer');
-- row 43
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Aranea Kaminari (Day)','Aranea Kaminari','https://docs.google.com/spreadsheets/d/11jnau8uSoMt723ndZJG_PFR-0zS6_uIJDzwn422khQM/edit?usp=sharing',1400,'Youkai','Kitsune',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Mage','Electromancer');
-- row 44
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Aoyama, Shiro (Mordivandros)','Shiro Aoyama','https://docs.google.com/spreadsheets/d/12r81xdASHuFZguOEbgDtgfGISpQapiYu/edit?usp=sharing&ouid=107540010604117561993&rtpof=true&sd=true',1225,'Youkai','Yuki-onna',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Martial Artist','Ranger','Cryomancer');
-- row 45
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Aki (Mega Mike 70)','Aki Nerys','https://docs.google.com/spreadsheets/d/11ZkVW8TzmVCHvZ3IoFpzADyudch5ijkd/edit?usp=sharing&ouid=100255924412336433744&rtpof=true&sd=true',1205,'Youkai','Yuki-onna','5/12/2025','5/21/2025','5/27/2025') RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Alchemist','Mage','Cryomancer');
-- row 46
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Hannah Suffolk (Velvet Crowe)','Hannah Suffolk','https://docs.google.com/spreadsheets/d/1lmDUJVYAb6NB_iWQEW4OpBEzzw__U1XL/edit?gid=1997331408#gid=1997331408',1300,'Chimera','Dogfolk',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Fighter','Guardian');
-- row 47
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Cendarion Ordir(Claw)','Cendarion Ordir','https://docs.google.com/spreadsheets/d/1vz4dHxdcSxHs_dyPVEYEfL9U1Y7iQlvM/edit?usp=sharing&ouid=111986131275884761407&rtpof=true&sd=true',1175,'Fae','Cait Sith',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Rogue','Ranger','Adventurer');
-- row 48
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Leaflit','Queri','https://docs.google.com/spreadsheets/d/19c19pjdoyLGabkljTglQj79zCRech6Jm/edit?gid=95407551#gid=95407551',1880,'Fae','Pixie','5/2/2025','5/28/2025','6/3/2025') RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Alchemist','Transmuter','Fighter','Alkahest');
-- row 49
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Kuroshiro (RognarB)','Kuroshiro','https://docs.google.com/spreadsheets/d/1CD5JXclbS5LAGobaZ5ZH50mfB6KUkgZz/edit?usp=sharing&ouid=101615191085713643468&rtpof=true&sd=true',1265,'Youkai','Kitsune','5/1/2025','5/15/2025','5/20/2025') RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Rogue','Saboteur');
-- row 50
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Gin Pakkun (ARC)','Gin Pakkun','https://docs.google.com/spreadsheets/d/1ewWCf7cuPKsBkbZ0qRiUmTVisvhHOVOS/edit?usp=sharing&ouid=114685559888350341393&rtpof=true&sd=true',1000,'Chimera','Dogfolk',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Cavalier','Fighter');
-- row 51
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Bobo (Jack Slurpee)','Bobo','https://docs.google.com/spreadsheets/d/11m8LWzDIvC7tjDLKsoVP3YHbsQB02GP4/edit?usp=sharing&ouid=100275211249997859484&rtpof=true&sd=true',1015,'Youkai','Jiangshi','5/1/2025','5/15/2025','5/20/2025') RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Acolyte','Shieldwarden');
-- row 52
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Daimus D'' Phnom (mightygerm)','Daimus D'' Phnom','https://docs.google.com/spreadsheets/d/1N46iNXUJx-7qmoa0myRIRrb-3wILMHZu/edit?usp=sharing&ouid=113614747793717102959&rtpof=true&sd=true',1565,'Demon','D''',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Mage','Fighter','Spellblade');
-- row 53
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Stout (invisi)','Stout Tou','https://docs.google.com/spreadsheets/d/e/2PACX-1vTPeg_Md6bbrpoBfp512jJ1ErXOH0PExs25M4RJaZt8X_AbZqsASOFyKMg_IVEpcA/pubhtml',1210,'Fae','Salamander',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Acolyte','Bard');
-- row 54
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Takeshi Satoshi (John_Softpaw)','Takeshi Satoshi','https://docs.google.com/spreadsheets/d/1FiFGUCoCIULrx9Id61xaIUwTffB9vFsnYlk-7OQuJt4/edit?usp=sharing',1100,'Youkai','Oni',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Martial Artist','Wave Palm Style');
-- row 55
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('BLiNX','Hiscibus','https://docs.google.com/spreadsheets/d/1bQrCg3ZjG_NGqM-wYGlnMuU9x6LNPu_I/edit?usp=sharing&ouid=112753295979445814324&rtpof=true&sd=true',1050,'Fae','Dullahan','5/12/2025','5/21/2025','5/27/2025') RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Adventurer','Fighter','Shield Paladin');
-- row 56
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Ryugo','Tenshi Mura','https://docs.google.com/spreadsheets/d/1XWNItf7QhLjTCqW2ftEfiMAoHOduKmGn/edit?gid=1997331408#gid=1997331408',1050,'Youkai','Jiangshi',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Adventurer','Iaido Style');
-- row 57
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Synric','Synric Er''Ceidryn','https://docs.google.com/spreadsheets/d/1lFMEgace6mJBoo4_4kk3VQ29anUbeF5o/edit?gid=1997331408#gid=1997331408',1150,'Fae','Salamander',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Mage','Martial Artist','Ranger','Spellblade');
-- row 58
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Morialis_','Mori Shinsaka','https://docs.google.com/spreadsheets/d/1oyMacgT54LZW6q2Qdw77mDZ2ck3iceOi_ChdZuJwAXQ/edit?gid=1562682898#gid=1562682898',1125,'Youkai','Kitsune',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Rogue','Time Thief');
-- row 59
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('takurov','Vadi Strongholm','https://docs.google.com/spreadsheets/d/1wrfi_7e-tZwHI7Ux2i6GKFE8HRE97tps/edit?gid=1997331408#gid=1997331408',1225,'Human','​',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Fighter','Sword Paladin');
-- row 60
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Jckun','Teo','https://docs.google.com/spreadsheets/d/1orgtsOZfprIB236XpMkM0uHXbWU8PsbG/edit?gid=1997331408#gid=1997331408',900,'Fae','Dullahan',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Cavalier');
-- row 61
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Mr Carter','Nicholas Vi Morrow','https://docs.google.com/spreadsheets/d/1hywxBMNzGJZPsD9GNDZCYdnW1Nz-gFKF/edit?gid=1997331408#gid=1997331408',1065,'Demon','Vi',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Alchemist','Alchemeister');
-- row 62
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Ayra','Rin','https://docs.google.com/spreadsheets/d/1okJw7brAsfytu9NNQLiPwDz5iQEoDJH0/edit?gid=1997331408#gid=1997331408',950,'Youkai','Tengu',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Farmer');
-- row 63
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('truthsm','Orianne Carroll','https://docs.google.com/spreadsheets/d/1lUcmDLaQAyXqN75rTn_4lbXq1u5XJC4g/edit?gid=1997331408#gid=1997331408',1150,'Chimera','Rabbitfolk','5/12/2025','5/21/2025','5/27/2025') RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Transmuter','Bloodbinder');
-- row 64
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Tay Lir''Lord','Ray Lir''Lord','https://docs.google.com/spreadsheets/d/1P8xBqovQXMp8ZKrz4j4f062FYVxhBNkI/edit?gid=1997331408#gid=1997331408',1250,'Demon','Lir',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Ranger','Archer','Marksman');
-- row 65
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Mightygerm','Earthwhisper','https://docs.google.com/spreadsheets/d/1J_aC8NY77y5JGsJiggXZ_iPGQB-Ib7Sh/edit?gid=1997331408#gid=1997331408',1397,'Fae','Pixie',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Miner','Forager','Summoner');
-- row 66
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Sartory','Corscryf','https://docs.google.com/spreadsheets/d/1LurqGze2T5-u30lR10RuG0wFLDtdG2fn/edit?gid=1997331408#gid=1997331408',1060,'Chimera','Lizardfolk',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Fighter','Farmer','Adventurer');
-- row 67
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Don Bon','Rain Falls Goodbye','https://docs.google.com/spreadsheets/d/1HO8X0N0vWAros5lcDhegLifEbC4YovPM4rsmgxBsfVY/edit?gid=1997331408#gid=1997331408',1950,'Youkai','Tengu',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Martial Artist','Monk');
-- row 68
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Wahaha','Minerva','https://docs.google.com/spreadsheets/d/1QQcGc50OLk4woMGa9Qspr55-JIhKrgbD/edit?gid=1997331408#gid=1997331408',1295,'Chimera','Wolf-folk',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Ranger','Carpenter','Forager');
-- row 69
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Ryugo','Bakari Nasser','https://docs.google.com/spreadsheets/d/1Z35bBzVgxEGqpxlJrecxgvTR16sNKF1W/edit?gid=1997331408#gid=1997331408',1160,'Fae','Anubis',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Farmer','Fighter','Sword Paladin');
-- row 70
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Joe Chapman','Joe Chapman','https://docs.google.com/spreadsheets/d/1BhtVPOoWRGxvMVMFEDQcngQ-ytCfeIht/edit?gid=1997331408#gid=1997331408',1125,'Human','​',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Cavalier','Hussar');
-- row 71
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Vim N Vigor','Nepthyn','https://docs.google.com/spreadsheets/d/1qUO9EcomrjjCLX7AvsR3Dii4YtthEyBW/edit?gid=1997331408#gid=1997331408',1300,'Fae','Anubis',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Aetherie','Oracle');
-- row 72
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Fealoke','Argent Galesong','https://docs.google.com/spreadsheets/d/1x5XJVs1uCOvr5wKHNp_kdr16GuXIZIOlUuMNjlnWMFI/edit?gid=1997331408#gid=1997331408',1050,'Fae','Cait Sith',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Rogue','Flash Star Blade Style');
-- row 73
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Phantomxz','Alice','https://docs.google.com/spreadsheets/d/1dspBvhYpQ60XOnxVfKYY-r0dxhxXcbkl/edit?gid=1997331408#gid=1997331408',1135,'Fae','Dullahan',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Transmuter','Fighter','Berserker');
-- row 74
WITH c AS (INSERT INTO census_characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('Ragulmadon','Crassus Wrightson','https://docs.google.com/spreadsheets/d/1UPIFpceDEj3CmknWPVMG9rGssCRTlE1j/edit?usp=drivesdk&ouid=102692799981417481776&rtpof=true&sd=true',1170,'Human','​',NULL,NULL,NULL) RETURNING id)
INSERT INTO census_character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, census_classes cl WHERE cl.name IN ('Carpenter','Timberwright');