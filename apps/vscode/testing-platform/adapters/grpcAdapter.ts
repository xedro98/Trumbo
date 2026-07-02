import { AccountServiceClient } from "@trembo-grpc/account"
import { BrowserServiceClient } from "@trembo-grpc/browser"
import { CheckpointsServiceClient } from "@trembo-grpc/checkpoints"
import { CommandsServiceClient } from "@trembo-grpc/commands"
import { FileServiceClient } from "@trembo-grpc/file"
import { McpServiceClient } from "@trembo-grpc/mcp"
import { ModelsServiceClient } from "@trembo-grpc/models"
import { SlashServiceClient } from "@trembo-grpc/slash"
import { StateServiceClient } from "@trembo-grpc/state"
import { TaskServiceClient } from "@trembo-grpc/task"
import { UiServiceClient } from "@trembo-grpc/ui"
import { WebServiceClient } from "@trembo-grpc/web"
import { credentials } from "@grpc/grpc-js"
import { promisify } from "util"

const serviceRegistry = {
	"trembo.AccountService": AccountServiceClient,
	"trembo.BrowserService": BrowserServiceClient,
	"trembo.CheckpointsService": CheckpointsServiceClient,
	"trembo.CommandsService": CommandsServiceClient,
	"trembo.FileService": FileServiceClient,
	"trembo.McpService": McpServiceClient,
	"trembo.ModelsService": ModelsServiceClient,
	"trembo.SlashService": SlashServiceClient,
	"trembo.StateService": StateServiceClient,
	"trembo.TaskService": TaskServiceClient,
	"trembo.UiService": UiServiceClient,
	"trembo.WebService": WebServiceClient,
} as const

export type ServiceClients = {
	-readonly [K in keyof typeof serviceRegistry]: InstanceType<(typeof serviceRegistry)[K]>
}

export class GrpcAdapter {
	private clients: Partial<ServiceClients> = {}

	constructor(address: string) {
		for (const [name, Client] of Object.entries(serviceRegistry)) {
			this.clients[name as keyof ServiceClients] = new (Client as any)(address, credentials.createInsecure())
		}
	}

	async call(service: keyof ServiceClients, method: string, request: any): Promise<any> {
		const client = this.clients[service]
		if (!client) {
			throw new Error(`No gRPC client registered for service: ${String(service)}`)
		}

		const fn = (client as any)[method]
		if (typeof fn !== "function") {
			throw new Error(`Method ${method} not found on service ${String(service)}`)
		}

		try {
			const fnAsync = promisify(fn).bind(client)
			const response = await fnAsync(request.message)
			return response?.toObject ? response.toObject() : response
		} catch (error) {
			console.error(`[GrpcAdapter] ${service}.${method} failed:`, error)
			throw error
		}
	}

	close(): void {
		for (const client of Object.values(this.clients)) {
			if (client && typeof (client as any).close === "function") {
				;(client as any).close()
			}
		}
	}
}
