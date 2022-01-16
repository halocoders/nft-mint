import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import myEpicNft from './utils/MyEpicNFT.json';

import { Button, Alert, AlertIcon, Stack } from '@chakra-ui/react';

// Constants
const TWITTER_HANDLE = 'codewithrio';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
// const OPENSEA_LINK = '';
const TOTAL_MINT_COUNT = 30;
const rinkebyChainId = '0x4';

// 0xe5Fdf56d43f38627EB5e8e98b05efA01432F0f2A latest contract
const CONTRACT_ADDRESS = '0x445B2E5fD11969b2dafe2390A60F2B6334B24e53';
let connectedContract;

function App() {
  const [currentAccount, setCurrentAccount] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMint, setLoadingMint] = useState(false);
  const [urlOpensea, setUrlOpensea] = useState(null);
  const [totalMinted, setTotalMinted] = useState('-');
  const [error, setError] = useState(null);
  const [noMeta, setNoMeta] = useState(false);

  // connect contract function
  const connectContract = async () => {
    const { ethereum } = window;

    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    connectedContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      myEpicNft.abi,
      signer
    );
    connectedContract.getTotalNFTsMintedSoFar().then((res) => {
      setTotalMinted(res.toNumber());
    });
  };

  // check is wallet connected
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      setNoMeta(true);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      setConnected(true);
      setCurrentAccount(account);
      connectContract();
    } else {
      console.log('No authorized account found');
    }
  };

  // connect wallet
  const connectWallet = async () => {
    try {
      setLoading(true);
      const { ethereum } = window;

      if (!ethereum) {
        setNoMeta(true);
      }

      let chainId = await ethereum.request({ method: 'eth_chainId' });
      if (chainId !== rinkebyChainId) {
        setError('You are not connected to the Rinkeby Test Network!');
        setLoading(false);
      } else {
        setError(null);
        const accounts = await ethereum.request({
          method: 'eth_requestAccounts',
        });
        setCurrentAccount(accounts[0]);
        setLoading(false);
        setConnected(true);
        connectContract();
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  // mint
  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;
      setLoading(true);
      setLoadingMint(true);
      setUrlOpensea(null);

      if (ethereum) {
        let chainId = await ethereum.request({ method: 'eth_chainId' });

        if (chainId !== rinkebyChainId) {
          setError('You are not connected to the Rinkeby Test Network!');
          setLoading(false);
          setLoadingMint(false);
        } else {
          setError(null);
          connectedContract.on('NewEpicNFTMinted', (from, tokenId) => {
            // console.log(from, tokenId.toNumber());
            setUrlOpensea(
              `https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
            );
          });

          // console.log('Going to pop wallet now to pay gas...');
          let nftTxn = await connectedContract.makeAnEpicNFT();

          // console.log('Mining...please wait.');
          await nftTxn.wait(setLoading(true)).then(() => {
            connectedContract
              .getTotalNFTsMintedSoFar()
              .then((res) => setTotalMinted(res.toNumber()));
            setLoading(false);
            setLoadingMint(false);
            // console.log(
            //   `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
            // );
          });
        }
      } else {
        setLoading(false);
        setLoadingMint(false);
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setLoading(false);
      setLoadingMint(false);
      console.log(error);
    }
  };

  // Render Methods
  const renderNotConnectedContainer = () => {
    if (!connected) {
      return (
        <>
          <Button
            colorScheme="teal"
            size="md"
            isLoading={loading}
            onClick={connectWallet}
            disabled={noMeta}
          >
            Connect Wallet
          </Button>
          <Stack mt={4} mx={'auto'} maxW={'400px'}>
            {noMeta && (
              <Alert status="warning">
                <AlertIcon />
                Make sure you have Metamask
                <a
                  style={{ marginLeft: '4px', textDecoration: 'underline' }}
                  href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en"
                >
                  {' '}
                  installed
                </a>
              </Alert>
            )}
          </Stack>
        </>
      );
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  });

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text" style={{ marginBottom: '20px' }}>
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          <p style={{ color: 'white', marginBottom: '20px' }}>
            Account: {currentAccount.slice(0, 6)}....
            {currentAccount.slice(38, 42)}
          </p>
          <p style={{ color: 'white', marginBottom: '20px' }}>
            {totalMinted}/{TOTAL_MINT_COUNT} NFTs were minted
          </p>
          {renderNotConnectedContainer()}
          <div style={{ marginTop: '20px' }}>
            {connected && (
              <Button
                colorScheme="teal"
                variant="outline"
                onClick={askContractToMintNft}
                isLoading={loading}
              >
                Mint NFT
              </Button>
            )}
          </div>
          <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>
          <br />
          {urlOpensea && (
            <>
              <p style={{ color: 'white' }}>
                Here is your NFT! :{' '}
                <a
                  href={urlOpensea}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'white', textDecoration: 'underline' }}
                >
                  Link
                </a>
              </p>
              <p className="note">
                Rinkeby and OpenSea Test Network sometimes runs quite long. If
                your NFT doesn't show up, don't worry. Check back a few minutes
                or after a couple of hours, don't forget to save your NFT link!
              </p>
            </>
          )}
          {loadingMint && (
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                marginTop: '20px',
                pointerEvents: 'none',
              }}
            >
              <iframe
                title="giphy loading"
                src="https://giphy.com/embed/QBd2kLB5qDmysEXre9"
                width="480"
                height="150"
                frameBorder="0"
                class="giphy-embed"
                allowFullScreen
              ></iframe>
            </div>
          )}
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
}

export default App;
