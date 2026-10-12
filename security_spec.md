# Security Specification: VoteEase Firebase Integration

## 1. Data Invariants
1. Only authenticated administrators may create, modify, or delete elections, candidates, and voter rosters.
2. A voter roll number cannot vote more than once in the same election.
3. Once a vote record is written, it is immutable (no update or deletion allowed).
4. Public election metadata (name, positions, security code, active status) is readable for verification during voting.
5. All string fields must adhere strictly to size limits to prevent Denial of Wallet.
6. User email `jamalpursandeep41@gmail.com` is configured as the master bootstrap administrator.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Election Creation**: Anonymous user attempting to create an election document in `/elections/{electionId}`.
2. **Vote Tampering / Update**: Attacker attempting to update an existing vote record in `/votes/{voteId}`.
3. **Vote Deletion**: Attacker attempting to delete a vote audit record in `/votes/{voteId}`.
4. **Voter Impersonation Without Code**: User attempting to write directly to `/voters/{voterId}` without admin credentials.
5. **Ghost Field Injection**: Adding arbitrary admin rights (`role: "superadmin"`) during document update.
6. **Oversized String Payload**: Submitting a 500KB string into candidateName or rollNumber to exhaust memory.
7. **Negative Vote Injection**: Submitting candidate vote tallies directly rather than atomic ballot records.
8. **Election Deletion by Non-Admin**: Normal user attempting to delete `/elections/{electionId}`.
9. **Tampered Voter Roll Status**: Student attempting to set their own `hasVoted: "No"` after already voting.
10. **Malformed Security Code**: Security code with special characters attempting script injection.
11. **Orphaned Candidate Insertion**: Candidate created with non-existent election ID.
12. **Blanket Query Scraping**: Attempting a collection group query across all ballots without authorized context.
