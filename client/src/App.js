import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import myEpicNft from './utils/MyEpicNFT.json'

// Constants
const TWITTER_HANDLE = 'codewithrio';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = '';
const TOTAL_MINT_COUNT = 50;

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false)
  const [urlOpensea, setUrlOpensea] = useState(null)

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      setConnected(true)
      console.log("Found an authorized account:", account);
      setCurrentAccount(account)
    } else {
      console.log("No authorized account found")
    }
  }

  // connect wallet
  const connectWallet = async () => {
    try {
      setConnected(true)
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
      setConnected(false)
    }
  }

  // call contract
  const askContractToMintNft = async () => {
    const CONTRACT_ADDRESS = "0xb531bf8e079baC3162fb8dEfFeA8286dd81e6608";

    try {
      const { ethereum } = window;
      setLoading(true)

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          setUrlOpensea(`https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
          // alert(`Hey there! We've minted your NFT. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: <https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}>`)
        });

        console.log("Going to pop wallet now to pay gas...")
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log("Mining...please wait.")
        await nftTxn.wait(setLoading(true)).then(() => {
          setLoading(false)
          console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
        });

      } else {
        setLoading(false)
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setLoading(false)
      console.log(error)
    }
  }

  // Render Methods
  const renderNotConnectedContainer = () => {
    if (connected) {
      return (
        <button className="cta-button connect-wallet-button" style={{ opacity: '.5', cursor: 'not-allowed' }}>
          You're connected
        </button>
      )
    } else {
      return (
        <button className="cta-button connect-wallet-button" onClick={() => connectWallet()}>
          Connect to Wallet
        </button>
      )
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {renderNotConnectedContainer()}
          <br />
          {currentAccount !== "" && (
            <button onClick={askContractToMintNft} className={`cta-button connect-wallet-button ${loading ? 'disabled' : ''}`} style={{ marginTop: '20px' }}>
              Mint NFT
            </button>
          )
          }
          <br />
          {loading && <p className='url-link'>Loading...</p>}
          <br />
          {urlOpensea && <p className='url-link'>Here is your NFT! : {' '}
            <a href={urlOpensea} target="_blank" rel="noopener noreferrer" className='url-link'>Link</a>
          </p>}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
