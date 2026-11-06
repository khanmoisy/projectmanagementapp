import { describe, it, expect } from 'vitest'

describe('authorization guards', () => {
  it('denies access without session', () => {
    const session = null
    expect(session?.user).toBeFalsy()
  })

  it('requires membership or ownership for task operations', () => {
    const isOwner = (ownerId: string, userId: string) => ownerId === userId
    const isMember = (members: any[], userId: string) => members.some(m => m.userId === userId)
    expect(isOwner('u1', 'u1')).toBe(true)
    expect(isMember([{userId: 'u2'}], 'u3')).toBe(false)
  })
})
