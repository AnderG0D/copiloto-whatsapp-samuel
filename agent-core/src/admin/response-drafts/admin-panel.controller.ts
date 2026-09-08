import { Controller, Get, Header } from '@nestjs/common';
import { ADMIN_PANEL_HTML } from './admin-panel.page';

@Controller('admin/panel')
export class AdminPanelController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  page(): string {
    return ADMIN_PANEL_HTML;
  }
}
