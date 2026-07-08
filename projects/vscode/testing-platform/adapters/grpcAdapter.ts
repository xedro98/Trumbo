import { AccountServiceClient } from "@trumbo-grpc/account"
import { BrowserServiceClient } from "@trumbo-grpc/browser"
import { CheckpointsServiceClient } from "@trumbo-grpc/checkpoints"
import { CommandsServiceClient } from "@trumbo-grpc/commands"
import { FileServiceClient } from "@trumbo-grpc/file"
import { McpServiceClient } from "@trumbo-grpc/mcp"
import { ModelsServiceClient } from "@trumbo-grpc/models"
import { SlashServiceClient } from "@trumbo-grpc/slash"
import { StateServiceClient } from "@trumbo-grpc/state"
import { TaskServiceClient } from "@trumbo-grpc/task"
import { UiServiceClient } from "@trumbo-grpc/ui"
import { WebServiceClient } from "@trumbo-grpc/web"
import { credentials } from "@grpc/grpc-js"
import { promisify } from "util"

const serviceRegistry = {
	"trumbo.AccountService": AccountServiceClient,
	"trumbo.BrowserService": BrowserServiceClient,
	"trumbo.CheckpointsService": CheckpointsServiceClient,
	"trumbo.CommandsService": CommandsServiceClient,
	"trumbo.FileService": FileServiceClient,
	"trumbo.McpService": McpServiceClient,
	"trumbo.ModelsService": ModelsServiceClient,
	"trumbo.SlashService": SlashServiceClient,
	"trumbo.StateService": StateServiceClient,
	"trumbo.TaskService": TaskServiceClient,
	"trumbo.UiService": UiServiceClient,
	"trumbo.WebService": WebServiceClient,
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
