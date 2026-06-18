import { Controller, Get } from "@nestjs/common";

@Controller("admin/topics")
export class TopicController {
  @Get()
  getTopics() {
    return [
      { id: "se-ds-001", name: "Data Structures", code: "DS_01" },
      { id: "se-algo-001", name: "Algorithms", code: "ALGO_01" },
      { id: "se-oop-001", name: "OOP", code: "OOP_01" },
      { id: "se-dbms-001", name: "DBMS", code: "DBMS_01" },
      { id: "se-sd-001", name: "System Design", code: "SD_01" },
    ];
  }
}
