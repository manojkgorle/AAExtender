# BlocSoc

###### Descreption: smartAccount for users / programmable social recovarble smart account for users

use linux or wsl2 if you are on windows
install hardhat

step 1: clone github repo

```
npm install
npx hardhat node    
```
open new terminal
```
npx hardhat compile
node scripts/helpers.js
node scripts/app.js
```

open index.html in html folder

proceed by signup

& use the dashboard


How did we acheive this?

We took the advantage of AccountAbstraction kit from eth-infintism, to implement the things mentioned in ERC4337

Account abstracton provides a interface / entrypoint contract for people to send & do their userOP, this provides a privelage for users to write custom encryption for their accounts like aes, or some quantum resistant .


make post man calls to backend

signup api

localhost:4000/signup?email=mnjkjjlsljklsglljkle@gm.com&password=122

signin api 

localhost:4000/signin?email=mnjglle@gm.com&password=122

sendApi

localhost:4000/sendapi

balance api

localhost:4000/balance?sender=0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199

count api

localhost:4000/count


The contracts are deployed on mumbai testnet with address

===entrypoint addr= 0x96853Bb04dd3e3EdE2feb61759c66D38cA93b268
===simpleAccountFactory addr= 0x4AC6a88173CE9EB551e10f2F26Fc1ae599f49Cd8
===counter 0xC430f84a3430092a6E19D28A3ADC99f0003002d6

signup api

localhost:5000/signup?email=mnjkjjlsljklsglljkle@gm.com&password=122

signin api 

localhost:5000/signin?email=mnjglle@gm.com&password=122

sendApi

localhost:5000/sendapi

balance api

localhost:5000/balance?sender=0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199

count api

localhost:5000/count
