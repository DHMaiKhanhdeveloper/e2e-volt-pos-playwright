import { GraphQLClient } from '@api/clients/GraphQLClient';
import { StaffListResponse, StaffNode } from '@api/models/Staff';

const STAFF_LIST_QUERY = `
  query StaffList {
    staffList {
      id
      firstName
      lastName
      nickname
      staffCode
    }
  }
`;

export class StaffService {
  constructor(private readonly client: GraphQLClient) {}

  async list(): Promise<StaffNode[]> {
    const data = await this.client.query<StaffListResponse>(STAFF_LIST_QUERY, {
      operationName: 'StaffList',
    });
    return data.staffList;
  }

  async findByNickname(nickname: string): Promise<StaffNode | undefined> {
    const all = await this.list();
    return all.find((s) => s.nickname === nickname);
  }
}
