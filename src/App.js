import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Car from './components/Car';

// ABIs
import Listing from './abis/Listing.json'
import AutoSale from './abis/AutoSale.json'


// Config
import config from './config.json';

function App() {
  const [provider, setProvider] = useState(null)
  const [autoSale, setAutoSale] = useState(null)

  const [account, setAccount] = useState(null)

  const [cars, setCars] = useState([])
  const [car, setCar] = useState({})
  const [toggle, setToggle] = useState(false);

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)
    const network = await provider.getNetwork()

    const listing = new ethers.Contract(config[network.chainId].listing.address, Listing, provider)
    const totalSupply = await listing.totalSupply()
    const cars = []

    for (var i = 1; i <= totalSupply; i++) {
      const uri = await listing.tokenURI(i)
      const response = await fetch(uri)
      const metadata = await response.json()
      cars.push(metadata)
    }

    setCars(cars)

    const autoSale = new ethers.Contract(config[network.chainId].autoSale.address, AutoSale, provider)
    setAutoSale(autoSale)

    window.ethereum.on('accountsChanged', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = ethers.utils.getAddress(accounts[0])
      setAccount(account);
    })
  }

  useEffect(() => {
    loadBlockchainData()
  }, [])

  const togglePop = (car) => {
    setCar(car)
    toggle ? setToggle(false) : setToggle(true);
  }

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <Search />

      <div className='cards__section'>

        <h3>When Lambo? When supercar?</h3>

        <hr />

        <div className='cards'>
          {cars.map((car, index) => (
            <div className='card' key={index} onClick={() => togglePop(car)}>
              <div className='card__image'>
                <img src={car.image} alt="Car" />
              </div>
              <div className='card__info'>
                <h4>{car.attributes[0].value} ETH</h4>
                <p>
                  <strong>{car.attributes[2].value}</strong>Engine |
                  <strong>{car.attributes[3].value}</strong>Speed/Hsp |
                  <strong>{car.attributes[4].value}</strong>Mileage

                </p>
                <p>{car.name}</p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {toggle && (
        <Car car={car} provider={provider} account={account} autoSale={autoSale} togglePop={togglePop} />
      )}

    </div>
  );
}

export default App;