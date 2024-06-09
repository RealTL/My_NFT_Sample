const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('NFT', () => {
  const NAME = 'Dapp Punks'
  const SYMBOL = 'DP'
  const COST = ether(10)
  const MAX_SUPPLY = 25;
  const BASE_URI = 'ipfs://QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/';

  let nft, deployer, minter

  beforeEach(async () => {
    let accounts = await ethers.getSigners();
    deployer = accounts[0];
    minter = accounts[1];
  })

  describe('Deployment', () => {
    const ALLOW_MINTING_ON = (Date.now() + 12000).toString().slice(0,10); // 2 minutes from now

    beforeEach(async () => {
      const NFT = await ethers.getContractFactory('NFT')
      nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)
    })

    it('has correct name', async () => {
      expect(await nft.name()).to.equal(NAME)
    })

    it('has correct symbol', async () => {
      expect(await nft.symbol()).to.equal(SYMBOL)
    })

    it('has correct minting cost', async () => {
      expect(await nft.cost()).to.equal(COST)
    })

    it('has correct maximum supply', async () => {
      expect(await nft.maxSupply()).to.equal(MAX_SUPPLY)
    })

    it('has correct mint time', async () => {
      expect(await nft.allowMintingOn()).to.equal(ALLOW_MINTING_ON)
    })

    it('has correct base URI', async () => {
      expect(await nft.baseURI()).to.equal(BASE_URI)
    })

    it('has correct owner', async () => {
      expect(await nft.owner()).to.equal(deployer.address)
    })
  });

  describe('Minting', () => {
    let transaction, result

    describe('Success', async () => {
      const ALLOW_MINTING_ON = Date.now().toString().slice(0,10); // Current time of transaction

      beforeEach(async () => {
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)

        transaction = await nft.connect(minter).mint(1, { value: COST });
        result = await transaction.wait();
      })

      it ('returns the address of minter', async () => {
        expect(await nft.ownerOf(1)).to.equal(minter.address);
      })

      it ('returns total number of tokens the minter owns', async () => {
        expect(await nft.balanceOf(minter.address)).to.equal(1);
      })
      
      // e.g. 'ipfs://QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/1.json'
      it('returns IPFS URI', async () => {
        expect(await nft.tokenURI(1)).to.equal(`${BASE_URI}1.json`);
        console.log("\x1b[38;5;117m",`         ${await nft.tokenURI(1)}`);
      })

      it('updates the total supply', async () => {
        expect(await nft.totalSupply()).to.equal(1);
      })

      it('updates the contract ether balance', async () => {
        expect(await ethers.provider.getBalance(nft.address)).to.equal(COST);
      })

      it('emits a Mint event', async () => {
        expect(await expect(transaction).to.emit(nft, 'Mint').withArgs(1, minter.address));
      })

    })

    describe('Failure', async () => {
      it('rejects insufficient payment amount', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0,10); // Current time of transaction
        const NFT = await ethers.getContractFactory('NFT');
          nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);
          await expect(nft.connect(minter).mint(1, { value: ether(1) })).to.be.reverted;
      });

      it('requires at least 1 NFT to be minted', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0,10); // Current time of transaction
        const NFT = await ethers.getContractFactory('NFT');
          nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);
          await expect(nft.connect(minter).mint(0, { value: COST })).to.be.reverted;
      });

      it('rejects minting before allowed time', async () => {
        const ALLOW_MINTING_ON = new Date('May 26, 2030 18:00:00').getTime().toString().slice(0,10);
        const NFT = await ethers.getContractFactory('NFT');
          nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);
          await expect(nft.connect(minter).mint(1, { value: COST })).to.be.reverted;
      });

      it('denies minting more NFTs than max amount', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0,10);
        const NFT = await ethers.getContractFactory('NFT');
          nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);
          await expect(nft.connect(minter).mint(100, { value: COST })).to.be.reverted;
      });

      it('does not return URI for non-existant NFTs', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0,10); // Current time of transaction
        const NFT = await ethers.getContractFactory('NFT');
          nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);
          nft.connect(minter).mint(1, { value: COST });
          await expect(nft.tokenURI('99')).to.be.reverted;
      });

    })

  });

  describe('Displaying NFTs', () => {
    let transaction, result
    const ALLOW_MINTING_ON = Date.now().toString().slice(0,10); // Current time of transaction

    beforeEach(async () => {
        const NFT = await ethers.getContractFactory('NFT');
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)
        // Mint 3 NFTs  
        transaction = await nft.connect(minter).mint(3, { value: ether(30) });
        result = await transaction.wait();
    });

    it('returns all NFTs for a given owner (i.e. 3 for this test)', async () => {
        let tokenIDs = await nft.walletOfOwner(minter.address);
        // console.log("Owner wallet", tokenIDs);
        expect(tokenIDs.length).to.equal(3);
        expect(tokenIDs[0].toString()).to.equal('1');
        expect(tokenIDs[1].toString()).to.equal('2');
        expect(tokenIDs[2].toString()).to.equal('3');
    });

  });

  describe('Owner and Access Checks', () => {
    let transaction, result, balanceBefore, costBefore

    describe('Success', async () => {
      const ALLOW_MINTING_ON = Date.now().toString().slice(0,10); // Current time of transaction

      beforeEach(async () => {
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)

        transaction = await nft.connect(minter).mint(1, { value: COST });
        result = await transaction.wait();

        balanceBefore = await ethers.provider.getBalance(deployer.address);
        costBefore = await nft.connect(deployer).cost();

        transaction = await nft.connect(deployer).withdraw();
        result = await transaction.wait();

        transaction = await nft.connect(deployer).setCost(ether(2));
        result = await transaction.wait();

        transaction = await nft.connect(deployer).setPausedState(true);
        result = await transaction.wait();
      })

      it('deducts the contract balance', async () => {
          expect(await ethers.provider.getBalance(nft.address)).to.equal(0);
      })

      it('sends funds to the deployer (i.e. contract owner)', async () => {
          //console.log("Balance of owner after withdraw: ", await ethers.provider.getBalance(deployer.address));
          expect(await ethers.provider.getBalance(deployer.address)).to.be.greaterThan(balanceBefore);
      })
      
      it('emits a Withdraw event', async () => {
          expect(transaction).to.emit(nft, 'Withdraw').withArgs(COST, deployer.address);
      })

      it('allows owner to update NFT cost', async () => {
        // console.log("NFT Cost before: ", costBefore , " - NFT Cost changed to: ", await nft.connect(deployer).cost())
        expect(await nft.connect(deployer).cost()).to.equal(ether(2));
      })

      it('allows owner to pause and unpause minting', async () => {
        console.log("\x1b[38;5;117m", "         Pause state: ", await nft.connect(deployer).getPausedState());
        expect(await nft.connect(deployer).getPausedState()).to.equal(true);
        await expect(nft.connect(minter).mint(2, { value: COST })).to.be.reverted;
        transaction = await nft.connect(deployer).setPausedState(false);
        result = await transaction.wait();
        console.log("\x1b[38;5;117m", "         Pause state: ", await nft.connect(deployer).getPausedState());
      })
    })

    describe('Failure', async () => {
      it('prevents non-owner from withdrawing', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0,10); // Current time of transaction
        const NFT = await ethers.getContractFactory('NFT');
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);
        nft.connect(minter).mint(1, { value: ether(1) })
        await expect(nft.connect(minter).withdraw()).to.be.reverted;
      });

      it('denies non-owner to update NFT cost', async () => {
        await expect(nft.connect(minter).setCost(ether(2))).to.be.reverted;
      })

      it('denies minting when paused', async () => {
        transaction = await nft.connect(deployer).setPausedState(true);
        result = await transaction.wait();
        await expect(nft.connect(minter).mint(2, { value: COST })).to.be.reverted;
        console.log("\x1b[38;5;117m", "         Pause state: ", await nft.connect(deployer).getPausedState());
      })

      it('denies non-owner from pausing minting', async () => {
        console.log("\x1b[38;5;117m", "         Pause state: ", await nft.connect(deployer).getPausedState());
        await expect(nft.connect(minter).setPausedState(false)).to.be.reverted;
      })

      it('allows minting to resume after unpausing', async () => {
        console.log("\x1b[38;5;117m", "         Minter balance before: ", "\x1b[33m", await nft.balanceOf(minter.address));
        transaction = await nft.connect(deployer).setPausedState(false);
        result = await transaction.wait();
        transaction = await nft.connect(minter).mint(1, { value: COST });
        result = await transaction.wait();
        console.log("\x1b[38;5;117m", "         Minter balance after: ", "\x1b[33m", await nft.balanceOf(minter.address));
        expect(await nft.balanceOf(minter.address)).to.equal(1);
      });
    });
  });
});
