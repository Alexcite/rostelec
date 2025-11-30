// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VotingSystem
 * @notice A simple decentralized voting system. The owner (deployer) can create
 * proposals, and anyone can vote once per proposal. Votes are tallied as
 * yes/no counts. The owner can finish a proposal to prevent further voting.
 */
contract VotingSystem is Ownable {
    struct Proposal {
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        bool active;
    }

    /// @notice Array of proposals. The index of each element is its ID.
    Proposal[] public proposals;

    /// @notice Tracks whether an address has voted on a specific proposal.
    /// mapping[proposalId][voter] => true/false
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Emitted when a new proposal is created.
    event ProposalCreated(uint256 indexed proposalId, string description);

    /// @notice Emitted when a vote is cast.
    event Voted(uint256 indexed proposalId, address indexed voter, bool support);

    /**
     * @dev Initializes the contract and sets the deployer as the owner.
     * `Ownable` in OpenZeppelin v5 requires an initial owner address.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Creates a new proposal. Anyone can call this function.
     *
     * Previously this function was restricted to the contract owner via the
     * `onlyOwner` modifier, but in a decentralized voting system it makes
     * more sense to allow any participant to propose ideas. The function
     * pushes a new active proposal into the array and emits a `ProposalCreated`
     * event. The returned ID corresponds to the index of the newly added
     * proposal in the `proposals` array.
     *
     * @param description A short description of what is being voted on.
     * @return proposalId The ID of the newly created proposal.
     */
    function createProposal(string calldata description) external returns (uint256 proposalId) {
        proposals.push(Proposal({description: description, yesVotes: 0, noVotes: 0, active: true}));
        proposalId = proposals.length - 1;
        emit ProposalCreated(proposalId, description);
    }

    /**
     * @notice Casts a vote on a given proposal. Each address can vote once per proposal.
     * @param proposalId The ID of the proposal to vote on.
     * @param support True for a 'yes' vote, false for a 'no' vote.
     */
    function vote(uint256 proposalId, bool support) external {
        require(proposalId < proposals.length, "VotingSystem: invalid proposal");
        Proposal storage proposal = proposals[proposalId];
        require(proposal.active, "VotingSystem: voting is closed");
        require(!hasVoted[proposalId][msg.sender], "VotingSystem: already voted");
        if (support) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }
        hasVoted[proposalId][msg.sender] = true;
        emit Voted(proposalId, msg.sender, support);
    }

    /**
     * @notice Finishes a proposal, preventing any further votes. Only owner can finish.
     * @param proposalId The ID of the proposal to finish.
     */
    function finishProposal(uint256 proposalId) external onlyOwner {
        require(proposalId < proposals.length, "VotingSystem: invalid proposal");
        Proposal storage proposal = proposals[proposalId];
        require(proposal.active, "VotingSystem: proposal already finished");
        proposal.active = false;
    }

    /**
     * @notice Returns details of a proposal.
     * @param proposalId The ID of the proposal to view.
     */
    function getProposal(uint256 proposalId)
        external
        view
        returns (string memory description, uint256 yesVotes, uint256 noVotes, bool active)
    {
        require(proposalId < proposals.length, "VotingSystem: invalid proposal");
        Proposal storage p = proposals[proposalId];
        return (p.description, p.yesVotes, p.noVotes, p.active);
    }

    /**
     * @notice Returns the total number of proposals created.
     */
    function getProposalsCount() external view returns (uint256) {
        return proposals.length;
    }
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VotingSystem
 * @dev Простая децентрализованная система голосования.
 * Любой пользователь может создать предложение и проголосовать
 * (один раз за каждое предложение). Владелец контракта может
 * завершить голосование по предложению.
 */
contract VotingSystem is Ownable {
    struct Proposal {
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        bool active;
    }

    /// Список всех предложений. Индекс = ID предложения.
    Proposal[] public proposals;

    /// hasVoted[proposalId][voter] => проголосовал ли адрес за это предложение.
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed proposalId, string description);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalFinished(uint256 indexed proposalId);

    /// В OpenZeppelin v5 нужно явно передать владельца в конструктор Ownable.
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Создать новое предложение.
     * @param description Текст вопроса / предложения для голосования.
     * @return proposalId ID нового предложения.
     */
    function createProposal(string calldata description) external returns (uint256 proposalId) {
        proposals.push(Proposal({
            description: description,
            yesVotes: 0,
            noVotes: 0,
            active: true
        }));
        proposalId = proposals.length - 1;
        emit ProposalCreated(proposalId, description);
    }

    /**
     * @notice Проголосовать по предложению.
     * @param proposalId ID предложения.
     * @param support true — голос "за", false — "против".
     */
    function vote(uint256 proposalId, bool support) external {
        require(proposalId < proposals.length, "VotingSystem: invalid proposal");
        Proposal storage proposal = proposals[proposalId];
        require(proposal.active, "VotingSystem: voting is closed");
        require(!hasVoted[proposalId][msg.sender], "VotingSystem: already voted");

        if (support) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }

        hasVoted[proposalId][msg.sender] = true;
        emit Voted(proposalId, msg.sender, support);
    }

    /**
     * @notice Завершить голосование по предложению (может только владелец).
     */
    function finishProposal(uint256 proposalId) external onlyOwner {
        require(proposalId < proposals.length, "VotingSystem: invalid proposal");
        Proposal storage proposal = proposals[proposalId];
        require(proposal.active, "VotingSystem: already finished");
        proposal.active = false;
        emit ProposalFinished(proposalId);
    }

    /// Получение данных по предложению.
    function getProposal(uint256 proposalId)
        external
        view
        returns (string memory description, uint256 yesVotes, uint256 noVotes, bool active)
    {
        require(proposalId < proposals.length, "VotingSystem: invalid proposal");
        Proposal storage p = proposals[proposalId];
        return (p.description, p.yesVotes, p.noVotes, p.active);
    }

    /// Количество предложений.
    function getProposalsCount() external view returns (uint256) {
        return proposals.length;
    }
}
}