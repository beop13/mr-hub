import type { Activity, MR, MRRef, User } from '../shared/domain.ts'

export interface Provider {
  readonly name: string
  currentUser(): Promise<User>
  authoredMRs(me: User): Promise<MR[]>
  reviewMRs(me: User): Promise<MR[]>
  activity(ref: MRRef): Promise<Activity>
}
