const { clear } = require("@testing-library/user-event/dist/clear");
const hre = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
  // Setup accounts
  const [buyer, seller, creditor, lender] = await ethers.getSigners()

  // Deploy Cars
  const Listing = await ethers.getContractFactory('Listing')
  const listing = await Listing.deploy()
  await listing.deployed()

  console.log(`Deployed Listing Contract at: ${listing.address}`)
  console.log(`Minting 6 Cars...\n`)

  for (let i = 0; i < 6; i++) {
    const transaction = await listing.connect(seller).mint(`https://ipfs.io/ipfs/QmaHo7MPSZ3pdMBDxA5RGCmnq6i2t21fbeNESWsLXNfWV3/${i + 1}.json`)
    await transaction.wait()
  }

  // Deploy AutoSale
  const AutoSale = await ethers.getContractFactory('AutoSale')
  const autoSale = await AutoSale.deploy(
    listing.address,
    seller.address,
    creditor.address,
    lender.address
  )
  await autoSale.deployed()

  console.log(`Deployed AutoSale Contract at: ${autoSale.address}`)
  console.log(`Listing 6 cars...\n`)

  for (let i = 0; i < 6; i++) {
    // Approve cars...
    let transaction = await listing.connect(seller).approve(autoSale.address, i + 1)
    await transaction.wait()
  }

  // Listing cars...
  transaction = await autoSale.connect(seller).list(1, buyer.address, tokens(20), tokens(10))
  await transaction.wait()

  transaction = await autoSale.connect(seller).list(2, buyer.address, tokens(15), tokens(5))
  await transaction.wait()

  transaction = await autoSale.connect(seller).list(3, buyer.address, tokens(10), tokens(5))
  await transaction.wait()

  transaction = await autoSale.connect(seller).list(4, buyer.address, tokens(10), tokens(5))
  await transaction.wait()

  transaction = await autoSale.connect(seller).list(5, buyer.address, tokens(15), tokens(5))
  await transaction.wait()

  transaction = await autoSale.connect(seller).list(6, buyer.address, tokens(15), tokens(5))
  await transaction.wait()

  console.log(`Finished.`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});