import { setup, assign } from 'xstate';

export type RaftContext = {
    nodeId: string;
    term: number;
    votedFor: string | null;
    votesReceived: Set<string>;
    electionTimeout: number; // ms
    elapsed: number; // ms since last heartbeat/election start
};

export type RaftEvent =
    | { type: 'TICK'; dt: number }
    | { type: 'VOTE_REQUEST'; candidateId: string; term: number }
    | { type: 'VOTE_RESPONSE'; term: number; granted: boolean; from: string }
    | { type: 'HEARTBEAT'; leaderId: string; term: number };

export const raftMachine = setup({
    types: {
        context: {} as RaftContext,
        events: {} as RaftEvent,
        input: {} as { nodeId: string; }
    },
    actions: {
        resetElectionTimer: assign({ elapsed: 0 }),
        incrementTerm: assign({ term: ({ context }) => context.term + 1 }),
        voteForCandidate: assign({
            votedFor: ({ event }) => (event.type === 'VOTE_REQUEST' ? event.candidateId : null),
            term: ({ event, context }) => (event.type === 'VOTE_REQUEST' && event.term > context.term ? event.term : context.term)
        }),
        updateTerm: assign({
            term: ({ event, context }) =>
                ('term' in event && event.term > context.term) ? event.term : context.term,
            votedFor: ({ event, context }) =>
                ('term' in event && event.term > context.term) ? null : context.votedFor
        }),
        becomeFollower: assign({ votedFor: null }),
    },
    guards: {
        canVote: ({ context, event }) => {
            if (event.type !== 'VOTE_REQUEST') return false;
            const isTermCurrentOrNewer = event.term >= context.term;
            const notVotedOrVotedForCandidate = context.votedFor === null || context.votedFor === event.candidateId;
            return isTermCurrentOrNewer && notVotedOrVotedForCandidate;
        },
        isHigherTerm: ({ context, event }) => {
            return 'term' in event && event.term > context.term;
        }
    }
}).createMachine({
    id: 'raft',
    initial: 'follower',
    context: ({ input }) => ({
        nodeId: input.nodeId,
        term: 0,
        votedFor: null,
        votesReceived: new Set<string>(),
        // Random timeout between 2000ms and 6000ms. 
        // This large variance (4000ms spread) guarantees one node times out well before others.
        electionTimeout: 2000 + Math.random() * 4000,
        elapsed: 0,
    }),
    on: {
        // Global rule: If we see a higher term, update term and become follower immediately
        VOTE_REQUEST: {
            guard: 'isHigherTerm',
            target: '.follower',
            actions: [
                'voteForCandidate',
                'resetElectionTimer'
            ]
        },
        HEARTBEAT: {
            guard: 'isHigherTerm',
            target: '.follower',
            actions: ['updateTerm', 'resetElectionTimer']
        },
        VOTE_RESPONSE: {
            guard: 'isHigherTerm',
            target: '.follower',
            actions: ['updateTerm', 'resetElectionTimer']
        }
    },
    states: {
        follower: {
            on: {
                TICK: [
                    {
                        guard: ({ context, event }) => (context.elapsed + event.dt) >= context.electionTimeout,
                        target: 'candidate'
                    },
                    {
                        actions: assign({ elapsed: ({ context, event }) => context.elapsed + event.dt }),
                    }
                ],
                HEARTBEAT: {
                    actions: ['resetElectionTimer', 'updateTerm'],
                },
                VOTE_REQUEST: {
                    guard: 'canVote',
                    actions: ['voteForCandidate', 'resetElectionTimer'],
                }
            },
        },
        candidate: {
            entry: [
                'incrementTerm',
                'resetElectionTimer',
                assign({
                    votedFor: ({ context }) => context.nodeId,
                    votesReceived: ({ context }) => new Set([context.nodeId]) // Vote for self
                })
            ],
            on: {
                TICK: [
                    {
                        guard: ({ context, event }) => (context.elapsed + event.dt) >= context.electionTimeout,
                        target: 'candidate' // Restart election
                    },
                    {
                        actions: assign({ elapsed: ({ context, event }) => context.elapsed + event.dt }),
                    }
                ],
                HEARTBEAT: {
                    target: 'follower', // Valid leader exists
                    actions: ['resetElectionTimer', 'updateTerm'],
                },
                VOTE_RESPONSE: {
                    guard: ({ context, event }) => event.term === context.term && event.granted,
                    actions: assign({
                        votesReceived: ({ context, event }) => {
                            const newVotes = new Set(context.votesReceived);
                            newVotes.add(event.from);
                            return newVotes;
                        }
                    })
                },
            },
            // Transition to leader if quorum reached
            always: {
                guard: ({ context }) => context.votesReceived.size >= 3, // Simple quorum (3/5)
                target: 'leader'
            }
        },
        leader: {
            entry: ['resetElectionTimer'],
            on: {
                TICK: {
                    // Leader sends heartbeats logic handled purely by visualizer for now
                    actions: assign({ elapsed: ({ context, event }) => context.elapsed + event.dt }),
                },
            },
        },
    },
});
