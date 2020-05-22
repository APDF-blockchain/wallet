# wallet
This is a wallet server, similar to the node and the miner.

# Run the application
To run this application, run 'npm start' in the root directory of the project.

# How to start things up
1. To start the first node run 'HTTP_PORT=4001 npm start' or 'npm start' which defaults 
    to the 4001

# JSDoc
1. run npm i typedoc
2. The command in 1. is only required once.
3. Run 'mkdir docs' in the root directory.
4. cd to src
5. run '../node_modules/.bin/typedoc --out ../docs --mode modules .'
6. This will create .html files in the /docs directory.  You can open the index.html file to view the documentation

# Some useful curl commands

## Init the wallet
curl -H "Content-Type: application/json" -X POST http://localhost:4001/wallet/init

## Create a txOut
curl -H "Content-Type: application/json" -X POST http://localhost:4001/wallet/create-tx-out/12345/54321/10/5

# Example HTTP GET requests

## For getBalance()
This is an ugly looking GET request, but it does allow the browser to execute it with an array count of 2.

http://localhost:4001/wallet/balance/f3a1e69b6176052fcc4a3248f1c5a91dea308ca9?unspentTxOuts[]={'txOutId': "1", 'txOutIndex': 1, 'address': "someadress", 'amount': 10}&unspentTxOuts[]={'txOutId': "1", 'txOutIndex': 1, 'address': "someadress", 'amount': 10}