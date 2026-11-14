export type Member = { id: string; name: string; className: string; color: string };
export type Token = Member & { x: number; y: number; hp: number; maxHp: number; initiative: number };
export type GameMessage = { id: string; type: 'chat' | 'roll' | 'system' | 'story'; text: string; at: number; author?: string; authorId?: string; results?: number[]; total?: number; critical?: boolean; sides?: number };
export type Session = { id: string; name: string; className: string };
export type RoomSummary = { id: string; title: string; description: string; scene: string; level: string; maxPlayers: number; duration: string; memberCount: number; members: Member[]; hostName: string; demo: boolean };
export type Room = Omit<RoomSummary, 'memberCount' | 'hostName'> & { hostId: string | null; tokens: Token[]; messages: GameMessage[]; activeTurn: number; round: number; createdAt: number };
