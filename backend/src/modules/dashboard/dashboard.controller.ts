import { Controller, Get, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  async getAdminDashboard() {
    const summary = await this.dashboardService.getAdminSummary();
    return {
      message: 'Ringkasan dashboard admin berhasil diambil',
      data: summary,
    };
  }

  @Get('user')
  async getUserDashboard(@Request() req: any) {
    const userId = req.user?.id || '2';
    const summary = await this.dashboardService.getUserSummary(userId);
    return {
      message: 'Ringkasan dashboard user berhasil diambil',
      data: summary,
    };
  }
}

