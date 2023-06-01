const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('AutoSale', () => {
    let buyer, seller, creditor, lender
    let listing, autoSale
    beforeEach(async () => {
        //Set accounts
        [buyer, seller,  creditor, lender] = await ethers.getSigners()
        
        //Deploy Listing
        const Listing = await ethers.getContractFactory('Listing')
        listing = await Listing.deploy()

        //Mint
        let transaction = await listing.connect(seller).mint("https://ipfs.io/ipfs/QmULjDPenvsrD7VJVrZ8GRdTXVHyAchekjaig3oyuhpz54/1.png")
        await transaction.wait()

        const AutoSale = await ethers.getContractFactory('AutoSale')
        autoSale = await AutoSale.deploy(
            listing.address,
            seller.address,
            creditor.address,
            lender.address
        )

         //Approve Car
        transaction = await listing.connect(seller).approve(autoSale.address, 1)
        await transaction.wait()

        //List car
        transaction = await autoSale.connect(seller).list(1, buyer.address, tokens(10), tokens(5))
        await transaction.wait()
        
    })

    describe('Deployment', () => {
        it('Returns NFT address', async () => {
            const result = await autoSale.nftAddress()
            expect(result).to.be.equal(listing.address)
        })

        it('Returns seller', async () => {
            const result = await autoSale.seller()
            expect(result).to.be.equal(seller.address)
        })

        it('Returns creditor', async () => {
            const result = await autoSale.creditor()
            expect(result).to.be.equal(creditor.address)
        })

        it('Returns lender', async () => {
            const result = await autoSale.lender()
            expect(result).to.be.equal(lender.address)
        })
    })

    describe('Listing', () => {
        it('Updates as listed', async () => {
            const result = await autoSale.isListed(1)
            expect(result).to.be.equal(true)
        })

        it('Updates ownership', async () => {
            expect(await listing.ownerOf(1)).to.be.equal(autoSale.address)
        })

        it('Returns buyer', async () => {
            const result = await autoSale.buyer(1)
            expect(result).to.be.equal(buyer.address)
        })

        it('Returns purchase price', async () => {
            const result = await autoSale.purchasePrice(1)
            expect(result).to.be.equal(tokens(10))
        })

        it('Returns autosale amount', async () => {
            const result = await autoSale.autosaleAmount(1)
            expect(result).to.be.equal(tokens(5))
        })

    })

    describe('Deposits', () => {
        beforeEach(async () => {
            const transaction = await autoSale.connect(buyer).depositEarnest(1, { value: tokens(5) })
            await transaction.wait()
        })

        it('Updates contract balance', async () => {
            const result = await autoSale.getBalance()
            expect(result).to.be.equal(tokens(5))
        })
    })

    describe('Credit', () => {
        beforeEach(async () => {
            const transaction = await autoSale.connect(creditor).updateCreditStatus(1, true)
            await transaction.wait()
        })

        it('Updates credit approval', async () => {
            const result = await autoSale.creditApproved(1)
            expect(result).to.be.equal(true)
        })
    })

    describe('Approval', () => {
        beforeEach(async () => {
            let transaction = await autoSale.connect(buyer).approveSale(1)
            await transaction.wait()

            transaction = await autoSale.connect(seller).approveSale(1)
            await transaction.wait()

            transaction = await autoSale.connect(lender).approveSale(1)
            await transaction.wait()
        })

        it('Updates approval status', async () => {
            expect(await autoSale.approval(1, buyer.address)).to.be.equal(true)
            expect(await autoSale.approval(1, seller.address)).to.be.equal(true)
            expect(await autoSale.approval(1, lender.address)).to.be.equal(true)
        })
    })

    describe('Sale', () => {
        beforeEach(async () => {
            let transaction = await autoSale.connect(buyer).depositEarnest(1, { value: tokens(5) })
            await transaction.wait()

            transaction = await autoSale.connect(creditor).updateCreditStatus(1, true)
            await transaction.wait()

            transaction = await autoSale.connect(buyer).approveSale(1)
            await transaction.wait()

            transaction = await autoSale.connect(seller).approveSale(1)
            await transaction.wait()

            transaction = await autoSale.connect(lender).approveSale(1)
            await transaction.wait()

            await lender.sendTransaction({ to: autoSale.address, value: tokens(5) })

            transaction = await autoSale.connect(seller).finalizeSale(1)
            await transaction.wait()
        })

        it('Updates ownership', async () => {
            expect(await listing.ownerOf(1)).to.be.equal(buyer.address)
        })

        it('Updates balance', async () => {
            expect(await autoSale.getBalance()).to.be.equal(0)
        })

    })
    
})

