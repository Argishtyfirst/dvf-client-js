#!/usr/bin/env node

/*
DO NOT EDIT THIS FILE BY HAND!
Examples are generated using helpers/buildExamples.js script.
Check README.md for more details.
*/

const HDWalletProvider = require('@truffle/hdwallet-provider')
const sw = require('starkware_crypto')
const Web3 = require('web3')

const DVF = require('../src/dvf')
const envVars = require('./helpers/loadFromEnvOrConfig')(
  process.env.CONFIG_FILE_NAME
)
const logExampleResult = require('./helpers/logExampleResult')(__filename)

const ethPrivKey = envVars.ETH_PRIVATE_KEY
// NOTE: you can also generate a new key using:`
// const starkPrivKey = dvf.stark.createPrivateKey()
const starkPrivKey = envVars.STARK_PRIVATE_KEY
const rpcUrl = envVars.RPC_URL

const provider = new HDWalletProvider(ethPrivKey, rpcUrl)
const web3 = new Web3(provider)
provider.engine.stop()

const dvfConfig = {
  api: envVars.API_URL,
  dataApi: envVars.DATA_API_URL
  // Add more variables to override default values
}

;(async () => {
  const dvf = await DVF(web3, dvfConfig)

  const waitForDepositCreditedOnChain = require('./helpers/waitForDepositCreditedOnChain')

  const token1 = 'ETH'
  const token2 = 'USDT'
  const depositETHResponse = await dvf.deposit(token1, 0.1, starkPrivKey)
  const depositUSDTResponse = await dvf.deposit(token2, 1000, starkPrivKey)

  if (process.env.WAIT_FOR_DEPOSIT_READY === 'true') {
    await waitForDepositCreditedOnChain(dvf, depositETHResponse)
    await waitForDepositCreditedOnChain(dvf, depositUSDTResponse)
  }

  const pool = `${token1}${token2}`

  // Amm deposit consist of 2 orders, one for each of the pool tokens.
  // The tokens need to be supplied in a specific ratio. This call fetches
  // order data from Deversifi API, given one of the tokens and desired deposit
  // amount for that token.
  const ammFundingOrderData = await dvf.getAmmFundingOrderData({
    pool,
    token: 'ETH',
    amount: 0.1
  })

  // ammFundingOrderData can be inspected/validate if desired, before signing
  // the orders it contains and posting them to Deversifi API.

  // This call signs the orders contained in the ammFundingOrderData before
  // posting them to Deversifi API. NOTE: if the orders are pre-signed, the
  // method will post them as is.
  const ammPostFundingOrderResponse = await dvf.postAmmFundingOrder(
    ammFundingOrderData
  )

  logExampleResult(ammPostFundingOrderResponse)

})()
.catch(error => {
  console.error(error)
  process.exit(1)
})

