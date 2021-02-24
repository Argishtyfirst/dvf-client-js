const Eth = require('@ledgerhq/hw-app-eth').default
const BN = require('bignumber.js')
const selectTransport = require('../../ledger/selectTransport')

module.exports = async (
  dvf,
  path,
  token,
  amount,
  sourceVault,
  destinationVault,
  receiverPublicKey
) => {
  const Transport = selectTransport(dvf.isBrowser)
  const {tokenAddress, quantization} = dvf.token.getTokenInfo(token)
  const nonce = dvf.util.generateRandomNonce()
  const transferQuantization = new BN(quantization)
  const amountTransfer = new BN(dvf.token.toQuantizedAmount(token, amount))

  const expireTime =
    Math.floor(Date.now() / (1000 * 3600)) +
    parseInt(dvf.config.defaultStarkExpiry)
  let starkPublicKey = await dvf.stark.ledger.getPublicKey(path)
  const transport = await Transport.create()
  const eth = new Eth(transport)
  const {address} = await eth.getAddress(path)
  const starkPath = dvf.stark.ledger.getPath(address)

  await dvf.token.provideContractData(eth, tokenAddress, transferQuantization)

  const starkSignature = await eth.starkSignTransfer_v2(
    starkPath,
    tokenAddress,
    token === 'ETH' ? 'eth' : 'erc20',
    transferQuantization,
    null,
    receiverPublicKey || starkPublicKey.x,
    sourceVault,
    destinationVault,
    amountTransfer,
    nonce,
    expireTime,
    null,
    null
  )
  await dvf.token.provideContractData(eth, token, tokenAddress, transferQuantization)
  await transport.close()

  return {starkPublicKey, nonce, expireTime, starkSignature}
}
