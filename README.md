# visual_guidance_task

running:

- install meteor (tested with version 2.0)
- navigate to root folder
- run command `meteor npm install --save @babel/runtime`
- run application with command `meteor`
- navigate to [http://localhost:3000/client/test](http://localhost:3000/client/test) and to [http://localhost:3000/expert/test](http://localhost:3000/expert/test)
- to create more rooms (only "test" room comes built-in) insert into the mongodb rooms collection an item `Grids.insert({_id: 'room_name', level: 'empty', gridData : [ [ false, false, false ], [ false, false, false ] ]});`, where `room_name` will replace the `test` in the url (previous bullet point)

notes:

- server/main.js contains mainly database access rules
- database/collections.js defines the collections used for the application, helpful when searching for data from mongodb
- client/main.js handles the main application state
- client folder also contains all the css
- imports/templates/piece.js contains most of the game logic
- imports/templates/templates.html contains most of the html elements
- imports/templates/chat.js and imports/templates/chat.html contains the chat box code
- restructuring would be helpful, for example imports/helpers folder could have more single function files, main.js and piece.js could be split to more files and at the least their division should be made clearer.