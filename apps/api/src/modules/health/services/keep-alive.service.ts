import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  constructor(private readonly configService: ConfigService) {}

  @Cron("*/10 * * * *")
  async handleCron() {
    const healthUrl = this.configService.get<string>("BACKEND_HEALTH_URL");

    if (!healthUrl) {
      this.logger.warn(
        "BACKEND_HEALTH_URL is not set. Keep-alive ping skipped.",
      );
      return;
    }

    // Get current hour in IST timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    });

    // formatter returns a string like "24" (for midnight) or "07" or "15"
    let currentHour = parseInt(formatter.format(new Date()), 10);

    // Intl.DateTimeFormat can sometimes return 24 for midnight, map to 0
    if (currentHour === 24) {
      currentHour = 0;
    }

    // Active window: 07:00 AM (7) to 11:59 PM (23)
    if (currentHour >= 7 && currentHour <= 23) {
      this.logger.log(
        `Active window (IST Hour: ${currentHour}). Sending keep-alive ping to ${healthUrl}`,
      );
      try {
        const response = await fetch(healthUrl);
        if (response.ok) {
          this.logger.log("Keep-alive ping successful.");
        } else {
          this.logger.error(
            `Keep-alive ping failed with status: ${response.status}`,
          );
        }
      } catch (error) {
        this.logger.error("Keep-alive ping failed.", error);
      }
    } else {
      this.logger.debug(
        `Outside active window (IST Hour: ${currentHour}). Keep-alive ping skipped.`,
      );
    }
  }
}
