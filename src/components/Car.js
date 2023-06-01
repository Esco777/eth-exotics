import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import close from '../assets/close.svg';

const Car = ({ car, provider, account, autoSale, togglePop }) => {
    const [hasBought, setHasBought] = useState(false)
    const [hasLended, setHasLended] = useState(false)
    const [hasCredited, setHasCredited] = useState(false)
    const [hasSold, setHasSold] = useState(false)

    const [buyer, setBuyer] = useState(null)
    const [lender, setLender] = useState(null)
    const [creditor, setCreditor] = useState(null)
    const [seller, setSeller] = useState(null)

    const [owner, setOwner] = useState(null)

    const fetchDetails = async () => {
        // -- Buyer

        const buyer = await autoSale.buyer(car.id)
        setBuyer(buyer)

        const hasBought = await autoSale.approval(car.id, buyer)
        setHasBought(hasBought)

        // -- Seller

        const seller = await autoSale.seller()
        setSeller(seller)

        const hasSold = await autoSale.approval(car.id, seller)
        setHasSold(hasSold)

        // -- Lender

        const lender = await autoSale.lender()
        setLender(lender)

        const hasLended = await autoSale.approval(car.id, lender)
        setHasLended(hasLended)

        // -- Creditor

        const creditor = await autoSale.creditor()
        setCreditor(creditor)

        const hasCredited = await autoSale.creditApproved(car.id)
        setHasCredited(hasCredited)
    }

    const fetchOwner = async () => {
        if (await autoSale.isListed(car.id)) return

        const owner = await autoSale.buyer(car.id)
        setOwner(owner)
    }

    const buyHandler = async () => {
        const autosaleAmount = await autoSale.autosaleAmount(car.id)
        const signer = await provider.getSigner()

        // Buyer deposit earnest
        let transaction = await autoSale.connect(signer).depositEarnest(car.id, { value: autosaleAmount })
        await transaction.wait()

        // Buyer approves...
        transaction = await autoSale.connect(signer).approveSale(car.id)
        await transaction.wait()

        setHasBought(true)
    }

    const creditorHandler = async () => {
        const signer = await provider.getSigner()

        // Creditor updates status
        const transaction = await autoSale.connect(signer).updateCreditStatus(car.id, true)
        await transaction.wait()

        setHasCredited(true)
    }

    const lendHandler = async () => {
        const signer = await provider.getSigner()

        // Lender approves...
        const transaction = await autoSale.connect(signer).approveSale(car.id)
        await transaction.wait()

        // Lender sends funds to contract...
        const lendAmount = (await autoSale.purchasePrice(car.id) - await autoSale.autosaleAmount(car.id))
        await signer.sendTransaction({ to: autoSale.address, value: lendAmount.toString(), gasLimit: 60000 })

        setHasLended(true)
    }

    const sellHandler = async () => {
        const signer = await provider.getSigner()

        // Seller approves...
        let transaction = await autoSale.connect(signer).approveSale(car.id)
        await transaction.wait()

        // Seller finalize...
        transaction = await autoSale.connect(signer).finalizeSale(car.id)
        await transaction.wait()

        setHasSold(true)
    }

    useEffect(() => {
        fetchDetails()
        fetchOwner()
    }, [hasSold])

    return (
        <div className="car">
            <div className='car__details'>
                <div className="car__image">
                    <img src={car.image} alt="Car" />
                </div>
                <div className="car__overview">
                    <h1>{car.name}</h1>
                    <p>
                    <strong>{car.attributes[2].value}</strong>Engine |
                    <strong>{car.attributes[3].value}</strong>Speed/Hsp |
                    <strong>{car.attributes[4].value}</strong>Mileage
                    </p>
                    <p>{car.name}</p>

                    <h2>{car.attributes[0].value} ETH</h2>

                    {owner ? (
                        <div className='car__owned'>
                            Owned by {owner.slice(0, 6) + '...' + owner.slice(38, 42)}
                        </div>
                    ) : (
                        <div>
                            {(account === creditor) ? (
                                <button className='car__buy' onClick={creditorHandler} disabled={hasCredited}>
                                    Credit Approved
                                </button>
                            ) : (account === lender) ? (
                                <button className='car__buy' onClick={lendHandler} disabled={hasLended}>
                                    Approve & Lend
                                </button>
                            ) : (account === seller) ? (
                                <button className='car__buy' onClick={sellHandler} disabled={hasSold}>
                                    Approve & Sell
                                </button>
                            ) : (
                                <button className='car__buy' onClick={buyHandler} disabled={hasBought}>
                                    Buy
                                </button>
                            )}

                            <button className='car__contact'>
                                Contact Dealer
                            </button>
                        </div>
                    )}

                    <hr />

                    <h2>Overview</h2>

                    <p>
                        {car.description}
                    </p>

                    <hr />

                    <h2>Facts and features</h2>

                    <ul>
                        {car.attributes.map((attribute, index) => (
                            <li key={index}><strong>{attribute.trait_type}</strong> : {attribute.value}</li>
                        ))}
                    </ul>
                </div>


                <button onClick={togglePop} className="car__close">
                    <img src={close} alt="Close" />
                </button>
            </div>
        </div >
    );
}

export default Car;