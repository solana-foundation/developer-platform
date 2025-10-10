import { Controller, Post, Body, Get } from '@nestjs/common';
import { RpcService } from './rpc.service';

@Controller('rpc')
export class RpcController {
  constructor(private readonly rpcService: RpcService) {}

  @Post()
  async forwardRpcRequest(@Body() jsonRpcRequest: any): Promise<any> {
    return this.rpcService.forwardRequest(jsonRpcRequest);
  }

  @Get('info')
  getProvidersInfo() {
    return this.rpcService.getProvidersInfo();
  }
}
