import { test as base } from '@playwright/test';
import { GraphQLClient } from '@api/clients/GraphQLClient';
import { StaffService } from '@api/services/StaffService';
import { ReportService } from '@api/services/ReportService';
import { IncomeSummaryService } from '@api/services/IncomeSummaryService';

export interface ApiFixture {
  graphql: GraphQLClient;
  staffService: StaffService;
  reportService: ReportService;
  incomeSummaryService: IncomeSummaryService;
}

export const apiFixture = base.extend<ApiFixture>({
  graphql: async ({}, use) => {
    await use(new GraphQLClient());
  },
  staffService: async ({ graphql }, use) => {
    await use(new StaffService(graphql));
  },
  reportService: async ({ graphql }, use) => {
    await use(new ReportService(graphql));
  },
  incomeSummaryService: async ({ graphql }, use) => {
    await use(new IncomeSummaryService(graphql));
  },
});
