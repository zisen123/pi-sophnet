# 普通模型

## Chat completions

### 请求说明

- 基本信息

请求地址：`https://www.sophnet.com/api/open-apis/v1/chat/completions`

请求方式：POST

- Header参数


| 名称          | 类型   | 必填 | 描述                   |
| ------------- | ------ | ---- | ---------------------- |
| Content-Type  | String | 是   | 固定值application/json |
| Authorization | String | 是   | "Bearer" + Apikey      |

- Body参数


| 名称              | 类型            | 必填 | 描述|
| ----------------- | -------------- | ---- | ------------------- |
| messages          | array(message) | 是   | 聊天上下文信息。支持多模态参数请求。<br>纯文本示例：messages=[{"role": "system", "content": "You are a helpful assistant."},{"role": "user", "content": "Knock knock."},{"role": "assistant", "content": "Who's there?"},{"role": "user", "content": "Orange."},]<br>多模态示例：{"messages":[{"role":"user","content":[{"type":"text","text":"describe the image in 100 words or less"},{"type":"image_url","image_url":{"url":"xxx","detail":"high"}}]}]}}|
| model             | string         | 是   | 模型|
| tools             | array          | 否   | 工具列表，只支持function|
| stream            | bool           | 否   | 是否以流式接口的形式返回数据，默认false|
| max_tokens        | integer        | 否   | 模型回复最大长度（单位 token）|
| temperature       | number         | 否   | 较高的数值会使输出更加随机，而较低的数值会使其更加集中。默认值1.0，取值范围[0,2.0]。|
| top_p             | number         | 否   | 影响输出文本的多样性，取值越大，生成文本的多样性越强。默认值1.0。|
| stop              | array(string)  | 否   | 停止生成更多Tokens的最多4个字符串。|
| presence_penalty  | number         | 否   | 通过对已生成的token增加惩罚，减少重复生成的现象。默认值0，取值范围：[-2.0, 2.0]。|
| frequency_penalty | number         | 否   | 根据新词在当前文本中的频率进行惩罚，降低模型逐字重复同一行的可能性。 默认值0，取值范围：[-2.0, 2.0]。|
| logprobs          | boolean        | 否   | 默认值false。是否返回输出 tokens 的对数概率。|
| top_logprobs      | integer        | 否   | 默认值0，取值范围为 [0, 20]。指定每个输出 token 位置最有可能返回的 token 数量，每个 token 都有关联的对数概率。仅当 logprobs为true 时可以设置 top_logprobs 参数。|
| response_format   | object         | 否   | 指定模型必须输出的格式的对象。<br>默认值： { "type": "text" } <br>设置为 { "type": "json_object" } 可启用 JSON 模式，这保证模型生成的消息是有效的 JSON。<br>重要：使用 JSON 模式时，您还必须通过系统或用户消息提示模型自行生成JSON。|
| chat_template_kwargs | object | 否 | 聊天模板参数对象 |
| chat_template_kwargs.enable_thinking | bool | 否 | 是否开启思考模式 |
| thinking | object | 否 | 思考配置对象，用于兼容不同模型的思考模式 |
| thinking.budget_tokens | integer | 否 | 思考预算token数，用于限制思考过程的token消耗 |
| enable_thinking | bool | 否 | 是否开启思考模式，此为兼容接口，效果同chat_template_kwargs.enable_thinking |
| max_completion_tokens | integer | 否 | 模型回复的最大完成token数，与max_tokens类似但更精确。当同时设置max_tokens和max_completion_tokens时，只能使用其中一个 |
| tool_choice | object/string | 否 | 工具选择策略。可以是"auto"（自动选择）、"none"（不使用工具）、"required"（必须使用工具）或指定特定工具 {"type": "function", "function": {"name": "tool_name"}} |
| parallel_tool_calls | boolean | 否 | 是否允许并行调用多个工具，默认为true |
| stop_token_ids | array(integer) | 否 | 停止token ID列表，用于指定停止生成的token ID |
| reasoning | object | 否 | 推理配置对象，用于控制模型的推理行为。包含enabled字段（boolean） |
| reasoning_effort | string | 否 | 推理努力程度，可选值："low"、"medium"、"high" |


### 响应说明

- 响应头参数


| 名称         | 值                                              | 描述 |
| ------------ | ----------------------------------------------- | ---- |
| Content-Type | 流式：text/event-stream非流式：application/json |      |

- 响应体参数
  
a.非流式

| 名称             | 类型   | 描述                                           |
| ---------------- | ------ | -------------------------------------------- |
| object           | string | 回包类型 chat.completion.chunk：多轮对话返回 |
| created          | int    | 时间戳                                       |
| model            | string | 模型<br>示例值：qwen3.6-flash    |
| choices          | array  |                                              |
| choices[0].index | int  | 索引                                         |
| choices[0].finish_reason | string  | 结束原因 正常结束：stop，token超长截断结束：length                                      |
| choices[0].message | object  | 模型回答                                         |
| choices[0].message.tool_calls | array | 工具列表 |
| choices[0].message.tool_calls[0].function | object | 函数调用信息 |
| choices[0].refs | array  | 引用列表，调用自定义模型且模型输出包含文档引用时存在。在非流式调用中，会在最终结果内输出此次回答包含的所有引用来源信息。                                         |
| choices[0].refs[0].index | int  | 引用来源出现顺序                                        |
| choices[0].refs[0].title | string  | 引用数据标题                                        |
| choices[0].refs[0].content | string  | 引用数据内容                                        |
| choices[0].refs[0].type | string  | 引用数据类型，file/qa/web， 分别代表文件知识， Q&A Table和web搜索                                     |
| choices[0].refs[0].url | string  | 引用数据url，其中，file和qa数据url访问需配置apikey，web数据url访问无需配置apikey                                        |

b.流式

| 名称             | 类型   | 描述                                           |
| ---------------- | ------ | -------------------------------------------- |
| object           | string | 回包类型 chat.completion.chunk：多轮对话返回 |
| created          | int    | 时间戳                                       |
| model            | string | 模型<br>示例值：qwen3.6-flash    |
| choices          | array  |                                              |
| choices[0].index | int  | 索引                                         |
| choices[0].finish_reason | string  | 结束原因 正常结束：stop，token超长截断结束：length                                      |
| choices[0].delta | object  | 模型回答                                         |
| choices[0].refs | array  | 引用列表，调用自定义模型且模型输出包含文档引用时存在。在流式响应过程中，会实时于存在引用的位置输出引用来源信息，并在finish_reason不为空时输出此次回答包含的所有引用来源信息。                                         |
| choices[0].refs[0].index | int  | 引用来源出现顺序                                        |
| choices[0].refs[0].title | string  | 引用数据标题                                        |
| choices[0].refs[0].content | string  | 引用数据内容                                        |
| choices[0].refs[0].type | string  | 引用数据类型，file/qa/web， 分别代表文件知识， Q&A Table和web搜索                                     |
| choices[0].refs[0].url | string  | 引用数据url，其中，file和qa数据url访问需配置apikey，web数据url访问无需配置apikey                                        |

### 请求示例

示例如下，请将参数示例值替换为实际值。

- 纯文本请求示例



```Bash
curl --location -g --request POST 'https://www.sophnet.com/api/open-apis/v1/chat/completions' \
--header "Authorization: Bearer $API_KEY" \
--header "Content-Type: application/json" \
--data-raw '{
    "messages": [
          {
            "role": "system",
            "content": "你是Sophnet的智能助手"
        },
        {
            "role": "user",
            "content": "你可以帮我做什么"
        }
    ],
    "model":"qwen3.6-flash"
}'
```

Python SDK

```Python
# 支持兼容OpenAI Python SDK  终端运行：pip install OpenAI
from openai import OpenAI

### 初始化客户端
client = OpenAI(
    api_key= "API_KEY",
    base_url= "https://www.sophnet.com/api/open-apis/v1"
)
### 调用接口
response = client.chat.completions.create(
    model="qwen3.6-flash",
    messages=[
        {"role": "system", "content": "你是Sophnet智能助手"},
        {"role": "user", "content": "你可以帮我做些什么"},
    ]
)
# 打印结果
print(response.choices[0].message.content)
```
- Function Call请求示例

HTTP API

```Bash
curl --location -g --request POST 'https://www.sophnet.com/api/open-apis/v1/chat/completions' \
--header "Authorization: Bearer $API_KEY" \
--header "Content-Type: application/json" \
--data-raw '{
    "messages": [
        {
            "role": "user",
            "content": "今日上海天气如何？"
        }
    ],
    "model":"DeepSeek-v3",
    "tools": [
        {
            "type": "function",
            "function":
            {
                "name": "get_weather",
                "description": "Get current temperature for provided coordinates in celsius.",
                "parameters":
                {
                    "type": "object",
                    "properties":
                    {
                        "latitude": {"type": "number"},
                        "longitude": {"type": "number"}
                    },
                    "required": ["latitude", "longitude"],
                    "additionalProperties": false
                },
                "strict": true
            }
        }
    ]
}'

# 请求成功后，从返回值的choices[0].message.tool_calls[0].function获取到函数调用信息
# 其中function.name是函数名，function.arguments中含有函数参数
# 假设已通过函数调用获取到返回值是20，且获取到choices[0].message.tool_calls[0].id = "call_f0j0i4meawn7kqx335d4fsj1"
# 接下来是第二次请求，其中messages列表的第一个与之前相同，第二个为choices[0].message.tool_calls，第三个的构造信息参考如下

curl --location -g --request POST 'https://www.sophnet.com/api/open-apis/v1/chat/completions' \
--header "Authorization: Bearer $API_KEY" \
--header "Content-Type: application/json" \
--data-raw '{
    "messages": [
        {
            "role": "user",
            "content": "今日上海天气如何？"
        },
        {
            "content": "",
            "role": "assistant",
            "tool_calls": [
                {
                    "id": "call_f0j0i4meawn7kqx335d4fsj1",
                    "type": "function",
                    "function":
                    {
                        "name": "get_weather",
                        "arguments": "{\"latitude\":31.2304,\"longitude\":121.4737}"
                    }
                }
            ]
        },
        {
            "role": "tool",
            "tool_call_id": "call_f0j0i4meawn7kqx335d4fsj1",
            "content": "20"
        }
    ],
    "model":"DeepSeek-v3",
    "tools": [
        {
            "type": "function",
            "function":
            {
                "name": "get_weather",
                "description": "Get current temperature for provided coordinates in celsius.",
                "parameters":
                {
                    "type": "object",
                    "properties":
                    {
                        "latitude": {"type": "number"},
                        "longitude": {"type": "number"}
                    },
                    "required": ["latitude", "longitude"],
                    "additionalProperties": false
                },
                "strict": true
            }
        }
    ]
}'

```

- 多模态请求示例

HTTP API

```Bash
curl --location -g --request POST 'https://www.sophnet.com/api/open-apis/v1/chat/completions' \
--header "Authorization: Bearer $API_KEY" \
--header "Content-Type: application/json" \
--data-raw '{
    "messages": [{
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "describe the image in 100 words or less"
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": "xxx"
                }
            }
        ]
    }],
    "model":"qwen3.6-flash",
    "stream":false
}'
```

Python SDK

```Python
# 支持兼容OpenAI Python SDK  终端运行：pip install OpenAI
from openai import OpenAI

### 初始化客户端
client = OpenAI(
    api_key= "API_KEY",
    base_url= "https://www.sophnet.com/api/open-apis/v1"
)
### 调用接口
response = client.chat.completions.create(
    model="qwen3.6-flash",
    messages=[
        {"role": "system", "content": "你是Sophnet智能助手"},
        {
            "role": "user",
            "content": [
                {
                    "type":"text",
                    "text":"描述一下这张图片"
                },
                {
                    "type":"image_url",
                    "image_url":{"url":xxx}
                }]
        },
    ]
)
# 打印结果
print(response.choices[0].message.content)
```

### 响应示例

流式 （event-stream）

```JSON
data:{"object":"chat.completion.chunk","created":1724651635,"model":"qwen3.6-flash","choices":[{"index":0,"delta":{"content":"我可以","role":"assistant"},"finish_reason":null}]}

data:{"object":"chat.completion.chunk","created":1724651635,"model":"qwen3.6-flash","choices":[{"index":0,"delta":{"content":"提供","role":null},"finish_reason":null}]}

data:{"object":"chat.completion.chunk","created":1724651635,"model":"qwen3.6-flash","choices":[{"index":0,"delta":{"content":"智能问答","role":null},"finish_reason":null}]}

data:{"object":"chat.completion.chunk","created":1724651635,"model":"qwen3.6-flash","choices":[{"index":0,"delta":{"content":"和帮助。","role":null},"finish_reason":null}]}

data:{"object":"chat.completion.chunk","created":1724651635,"model":"qwen3.6-flash","choices":[{"index":0,"delta":{"content":null,"role":null},"finish_reason":"stop"}]}
```

非流式 (Json)

```JSON
{
    "id": "chatcmpl-ec9970ca-f820-9e33-bf0b-1c7c19c283ff",
    "object": "chat.completion",
    "created": 1724652804,
    "model": "qwen3.6-flash",
    "usage": {
        "prompt_tokens": 23,
        "completion_tokens": 58,
        "total_tokens": 81
    },
    "choices": [
        {
            "index": 0,
            "message": {
                "content": "作为Sophnet智能助手，我可以帮助你完成多种任务。如果你有具体的需求或问题，请告诉我！",
                "role": "assistant",
                "reasoning_content": null
            },
            "finish_reason": "stop",
            "logprobs": null
        }
    ]
}
```

多模态非流式 (Json)

```JSON
{
    "id": "chatcmpl-dd860790-8034-989d-b351-d7dd92c5c945",
    "object": "chat.completion",
    "created": 1779439239,
    "model": "qwen3.6-flash",
    "usage": {
        "prompt_tokens": 498,
        "completion_tokens": 508,
        "total_tokens": 1006,
        "prompt_tokens_details": {
            "cached_tokens": 0,
            "text_tokens": 21,
            "image_tokens": 477
        },
        "completion_tokens_details": {
            "reasoning_tokens": 3,
            "text_tokens": 505
        }
    },
    "choices": [
        {
            "index": 0,
            "message": {
                "content": "This image captures a stunning volcanic landscape dominated by Mount Bromo in the foreground. Its rugged, brown cone features deep, radial valleys radiating from the summit, sitting atop a vast, barren plain often called the \"Sea of Sand.\" To the left, a smaller crater emits a wispy cloud of steam. Looming majestically in the background is the towering, conical peak of Mount Semeru, partially shrouded in mist. The scene is bathed in soft light under a pale blue sky, highlighting the dramatic contrast between the textured earth and the hazy horizon.",
                "role": "assistant",
                "reasoning_content": "The user wants a description of the provided image..."
            },
            "finish_reason": "stop",
            "logprobs": null
        }
    ]
}
```

Function Call (Json)
首次返回
```JSON
{
    "id": "59dea80ba7284cfe9f2315b7af6cf063",
    "object": "chat.completion",
    "created": 1744967746,
    "model": "DeepSeek-v3",
    "usage": {
        "prompt_tokens": 305,
        "completion_tokens": 88,
        "total_tokens": 393
    },
    "choices": [
        {
            "index": 0,
            "message": {
                "content": "我来帮您查询上海的天气。不过我需要先获取上海的经纬度坐标。上海的大致坐标是：纬度 31.2304，经度 121.4737。",
                "role": "assistant",
                "tool_calls": [
                    {
                        "id": "call_60ea549765f443908c25a1ce",
                        "type": "function",
                        "function": {
                            "name": "get_weather",
                            "arguments": "{\"latitude\": 31.2304, \"longitude\": 121.4737}"
                        }
                    }
                ]
            },
            "finish_reason": "tool_calls",
            "logprobs": null
        }
    ]
}
```
第二次返回
```JSON
{
    "id": "22e4cafb8466471aa6e1bd1a53526f7a",
    "object": "chat.completion",
    "created": 1744967193,
    "model": "DeepSeek-v3",
    "usage": {
        "prompt_tokens": 385,
        "completion_tokens": 61,
        "total_tokens": 446
    },
    "choices": [
        {
            "index": 0,
            "message": {
                "content": "根据查询结果，今天上海的当前气温是20°C，天气较为舒适。",
                "role": "assistant"
            },
            "finish_reason": "stop",
            "logprobs": null
        }
    ]
}
```

## Anthropic Messages

### 请求说明

- 基本信息

请求地址：
- 标准地址：`https://www.sophnet.com/api/open-apis/anthropic/v1/messages`
- 资源地址：`https://www.sophnet.com/api/open-apis/{logic_resource_uuid}/anthropic/v1/messages`

说明：资源地址用于指定特定的逻辑资源UUID。

请求方式：POST

- Header参数


| 名称          | 类型   | 必填 | 描述                   |
| ------------- | ------ | ---- | ---------------------- |
| Content-Type  | String | 是   | 固定值application/json |
| Authorization | String | 是   | "Bearer " + Apikey      |

- Body参数


| 名称              | 类型            | 必填 | 描述|
| ----------------- | -------------- | ---- | ------------------- |
| model             | string         | 是   | 模型名称，如DeepSeek-V3.1-Fast等|
| messages          | array(message) | 是   | 消息列表。<br>示例：[{"role": "user", "content": "Hello"}]<br>支持多模态输入：[{"role": "user", "content": [{"type": "text", "text": "描述图片"}, {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": "..."}}]}]|
| max_tokens        | integer        | 是   | 模型回复的最大token数|
| system            | string         | 否   | 系统提示词，用于设置助手的角色和行为|
| temperature       | number         | 否   | 采样温度，取值范围[0, 1]。较高的值会使输出更随机，较低的值会使其更集中和确定。默认值1.0|
| top_p             | number         | 否   | 核采样参数，取值范围[0, 1]。默认值根据模型而定|
| top_k             | integer        | 否   | 只从每个后续token的前K个选项中采样。默认值根据模型而定|
| stop_sequences    | array(string)  | 否   | 自定义停止序列，最多支持4个|
| stream            | boolean        | 否   | 是否以流式接口的形式返回数据，默认false|
| tools             | array          | 否   | 工具列表，用于函数调用|
| tool_choice       | object         | 否   | 工具选择策略，可设置为auto、any或指定特定工具|
| metadata          | object         | 否   | 元数据，包含user_id等信息|

### 响应说明

- 响应头参数


| 名称         | 值                                              | 描述 |
| ------------ | ----------------------------------------------- | ---- |
| Content-Type | 流式：text/event-stream<br>非流式：application/json |      |

- 响应体参数

a.非流式

| 名称             | 类型   | 描述                                           |
| ---------------- | ------ | -------------------------------------------- |
| id               | string | 消息的唯一标识符                                       |
| type             | string | 对象类型，固定为"message"    |
| role             | string | 角色，固定为"assistant"    |
| content          | array  | 内容数组                                              |
| content[0].type  | string | 内容类型，可以是"text"或"tool_use"                                         |
| content[0].text  | string | 文本内容（当type为text时）                                         |
| content[0].id    | string | 工具使用ID（当type为tool_use时）                                         |
| content[0].name  | string | 工具名称（当type为tool_use时）                                         |
| content[0].input | object | 工具输入参数（当type为tool_use时）                                         |
| model            | string | 使用的模型名称<br>示例值：DeepSeek-V3.1-Fast    |
| stop_reason      | string | 停止原因，可能的值：end_turn、max_tokens、stop_sequence、tool_use |
| stop_sequence    | string | 触发停止的序列（如果适用）                                        |
| usage            | object | Token使用情况                                        |
| usage.input_tokens | integer | 输入token数量                                        |
| usage.output_tokens | integer | 输出token数量                                        |

b.流式

| 名称             | 类型   | 描述                                           |
| ---------------- | ------ | -------------------------------------------- |
| type             | string | 事件类型，可能的值：message_start、content_block_start、content_block_delta、content_block_stop、message_delta、message_stop、ping |
| message          | object | 消息对象（在message_start事件中）|
| index            | integer | 内容块索引（在content_block事件中）|
| content_block    | object | 内容块对象（在content_block_start事件中）|
| delta            | object | 增量数据（在delta事件中）|
| delta.type       | string | 增量类型，如"text_delta"或"input_json_delta"|
| delta.text       | string | 增量文本内容|
| usage            | object | Token使用情况（在message_delta事件中）|

### 请求示例

示例如下，请将参数示例值替换为实际值。

- 纯文本请求示例

HTTP API

```Bash
curl --location -g --request POST 'https://www.sophnet.com/api/open-apis/anthropic/v1/messages' \
--header "Authorization: Bearer $API_KEY" \
--header "Content-Type: application/json" \
--data-raw '{
    "model": "DeepSeek-V4-Flash",
    "max_tokens": 1024,
    "messages": [
        {
            "role": "user",
            "content": "你好，请介绍一下你自己"
        }
    ]
}'
```

Python SDK

```Python
# 支持兼容Anthropic Python SDK  终端运行：pip install anthropic
from anthropic import Anthropic

### 初始化客户端
client = Anthropic(
    api_key="API_KEY",
    base_url="https://www.sophnet.com/api/open-apis/anthropic"
)

### 调用接口
message = client.messages.create(
    model="DeepSeek-V4-Flash",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "你好，请介绍一下你自己"}
    ]
)

# 打印结果
print(message.content[0].text)
```

- 多模态请求示例

HTTP API

```Bash
curl --location -g --request POST 'https://www.sophnet.com/api/open-apis/anthropic/v1/messages' \
--header "Authorization: Bearer $API_KEY" \
--header "Content-Type: application/json" \
--data-raw '{
    "model": "qwen3.6-flash",
    "max_tokens": 1024,
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "请描述这张图片"
                },
                {
                    "type": "image",
                    "source": {
                        "type": "url",
                        "url": "https://example.com/image.jpg"
                    }
                }
            ]
        }
    ]
}'
```

Python SDK

```Python
from anthropic import Anthropic

client = Anthropic(
    api_key="API_KEY",
    base_url="https://www.sophnet.com/api/open-apis/anthropic"
)

message = client.messages.create(
    model="qwen3.6-flash",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "请描述这张图片"
                },
                {
                    "type": "image",
                    "source": {
                        "type": "url",
                        "url": "https://example.com/image.jpg"
                    }
                }
            ]
        }
    ]
)

print(message.content[0].text)
```

- Tool Use（函数调用）请求示例

HTTP API

```Bash
curl --location -g --request POST 'https://www.sophnet.com/api/open-apis/anthropic/v1/messages' \
--header "Authorization: Bearer $API_KEY" \
--header "Content-Type: application/json" \
--data-raw '{
    "model": "DeepSeek-V4-Flash",
    "max_tokens": 1024,
    "tools": [
        {
            "name": "get_weather",
            "description": "获取指定城市的天气信息",
            "input_schema": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名称"
                    }
                },
                "required": ["city"]
            }
        }
    ],
    "messages": [
        {
            "role": "user",
            "content": "上海今天天气怎么样？"
        }
    ]
}'
```

### 响应示例

非流式 (JSON)

```JSON
{
    "id": "chatcmpl-3239ee13-a1a1-9849-a3e7-f5b94e26ced5",
    "type": "message",
    "role": "assistant",
    "content": [
        {
            "type": "text",
            "text": "你好！很高兴认识你！我是DeepSeek，由深度求索公司创造的AI助手。"
        }
    ],
    "model": "DeepSeek-V4-Flash",
    "stop_reason": "end_turn",
    "stop_sequence": null,
    "usage": {
        "input_tokens": 9,
        "output_tokens": 467
    }
}
```

多模态非流式 (JSON)

```JSON
{
    "id": "msg_5a7c60a8-6ce9-4bea-bd9b-eb0992479f7d",
    "type": "message",
    "role": "assistant",
    "content": [
        {
            "type": "thinking",
            "thinking": "用户希望我描述这张图片。这是一幅壮丽的自然风光照片，展示了一个巨大的湖泊或海湾，周围环绕着山脉和茂密的森林。"
        },
        {
            "type": "text",
            "text": "这是一张展现壮丽自然风光的照片，画面构图开阔，色彩和谐，给人一种宁静致远的感觉。画面的左下方和底部被大片茂密的针叶林所覆盖，中央是一片宽阔平静的水域，呈现出通透的绿松石色。远处可以看到连绵起伏的群山，笼罩在薄薄的雾霭中，呈现出蓝灰色或淡紫色的色调。天空颜色柔和，呈现出淡粉色到淡白色的渐变，表明拍摄时间可能是在清晨或傍晚。"
        }
    ],
    "model": "qwen3.6-flash",
    "stop_reason": "end_turn",
    "stop_sequence": null,
    "usage": {
        "input_tokens": 491,
        "output_tokens": 1094
    }
}
```

流式 (event-stream)

```JSON
event: message_start
data: {"type":"message_start","message":{"id":"msg_01XFDUDYJgAACzvnptvVoYEL","type":"message","role":"assistant","content":[],"model":"DeepSeek-V3.1-Fast","stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":12,"output_tokens":1}}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"你好"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"！"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"我是"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"DeepSeek"}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn","stop_sequence":null},"usage":{"output_tokens":58}}

event: message_stop
data: {"type":"message_stop"}
```

Tool Use响应示例

```JSON
{
    "id": "msg_11fda603-4cac-453b-bc42-6983e7461959",
    "type": "message",
    "role": "assistant",
    "content": [
        {
            "type": "thinking",
            "thinking": "用户想知道上海的天气情况。我可以使用get_weather工具来获取上海的天气信息。让我来调用这个工具。"
        },
        {
            "type": "tool_use",
            "id": "toolu_970464e82c3741b7b120685b",
            "name": "get_weather",
            "input": {
                "city": "上海"
            }
        }
    ],
    "model": "DeepSeek-V4-Flash",
    "stop_reason": "tool_use",
    "stop_sequence": null,
    "usage": {
        "input_tokens": 363,
        "output_tokens": 70
    }
}
```

## Embeddings

### 请求说明

- 基本信息

请求地址：`https://www.sophnet.com/api/open-apis/projects/{projectId}/easyllms/embeddings`

请求方式：POST

- Path参数：


| 名称      | 类型   | 必填 | 描述   |
| --------- | ------ | ---- | ------ |
| ProjectId | String | 是   | 项目id |

- Header参数


| 名称          | 类型   | 必填 | 描述                   |
| ------------- | ------ | ---- | ---------------------- |
| Content-Type  | String | 是   | 固定值application/json |
| Authorization | String | 是   | "Bearer" + Apikey      |

- Body参数


| 名称       | 类型   | 必填 | 描述                                                                                                                                                                                            |
| ---------- | ------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| model      | string | 否   | 支持：`text-embeddings`、`clip-embeddings`、`bge-m3`，默认为`text-embeddings` |
| input_texts | array(string) | 是   | 数组中每一个元素是一个文本，每个文本最大支持8192个Tokens。`text-embeddings`模型最大支持10个文本。|
| input_images | array(string) | 否   | 数组中每一个元素是一个base64 图像或 URL，仅对`clip-embeddings`模型有效 |
| dimensions  | integer       | 是   | 输出Embeddings的维度，`text-embeddings`模型支持1,024/768/512/256/128/64，`clip-embeddings`模型支持64到1024维，`bge-m3`模型仅支持1024维。 |
| easyllm_id | string | 是   | Easyllm ID                                                                                                                                                                                      |
| normalized | bool   | 否   | 是否使用L2规范化，仅对`clip-embeddings`模型有效 |
| encoding_type | string | 否| 输出数据的格式，仅对`clip-embeddings`模型有效 |

### 响应说明

- 响应头参数


| 名称         | 值               | 描述 |
| ------------ | ---------------- | ---- |
| Content-Type | application/json |      |

- 响应体参数


| 名称    | 类型   | 描述   |
| ------- | ------ | ------ |
| id | string | 任务id |
| usage | dict    | 模型推理时Token使用情况 |
| data | array    | 模型推理结果，按顺序输出，文本Embedding在前，图片Embedding在后 |

### 请求示例

HTTP API

```Bash
# sample1
curl --location --request POST 'https://www.sophnet.com/api/open-apis/projects/{projectId}/easyllms/embeddings' \
--header "Authorization: Bearer $API_KEY" \
--header "Content-Type: application/json" \
--data-raw '{
    "easyllm_id": "{YOUR_EASYLLM_ID}",
    "input_texts": ["你好", "很高兴认识你"],
    "dimensions": 1024
}'

# sample2
curl --location --request POST 'https://www.sophnet.com/api/open-apis/projects/{projectId}/easyllms/embeddings' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $API_KEY' \
--data-raw '{
    "model": "clip-embeddings",
    "easyllm_id": "{YOUR_EASYLLM_ID}",
    "input_texts": ["海滩上美丽的日落"],
    "input_images": ["https://i.ibb.co/nQNGqL0/1beach1.jpg", "https://i.ibb.co/r5w8hG8/beach2.jpg", "iVBORw0KGgoAAAANSUhEUgAAABwAAAA4CAIAAABhUg/jAAAAMklEQVR4nO3MQREAMAgAoLkoFreTiSzhy4MARGe9bX99lEqlUqlUKpVKpVKpVCqVHksHaBwCA2cPf0cAAAAASUVORK5CYII="],
    "dimensions": 1024
}'
```

### 响应示例

```JSON
// sample1
{
    "id": "",
    "object": "list",
    "usage": {
        "prompt_tokens": 4,
        "completion_tokens": null,
        "total_tokens": 4,
        "prompt_tokens_details": null,
        "completion_tokens_details": null
    },
    "data": [
        {
            "embedding": [
                -0.08296291530132294,
                0.03833295777440071,
                ...
            ],
            "index": 0,
            "object": "embedding"
        },
        {
            "embedding": [
                -0.05998880788683891,
                0.04025664180517197,
                ...
            ],
            "index": 1,
            "object": "embedding"
        }
    ]
}

// sample2
{
    "object": "list",
    "usage": {
        "prompt_tokens": 20008,
        "completion_tokens": null,
        "total_tokens": 20008,
        "prompt_tokens_details": null,
        "completion_tokens_details": null
    },
    "data": [
        {
            "embedding": [
                0.02087402,
                0.06689453,
                -0.07763672,
                -0.10253906,
                ...
            ],
            "index": 0,
            "object": "embedding"
        },
        {
            "embedding": [
                0.01507568,
                0.16015625,
                -0.08837891,
                ...
            ],
            "index": 1,
            "object": "embedding"
        },
        {
            "embedding": [
                0.04882812,
                0.20214844,
                -0.07861328,
                0.00276184,
                ...
            ],
            "index": 2,
            "object": "embedding"
        },
        {
            "embedding": [
                -0.00939941,
                0.18164062,
                0.02038574,
                0.01239014,
                ...
            ],
            "index": 3,
            "object": "embedding"
        }
    ]
}
```

## Document Parse

### 请求说明

- 基本信息

功能描述：高效转换主流格式文档至精准、易用的Markdown文本内容。上传文件（form-data），输出文档内容（Markdown）

请求地址：`https://www.sophnet.com/api/open-apis/projects/easyllms/doc-parse`

请求方式：POST

- Header参数


| 名称          | 类型   | 必填 | 描述                   |
| ------------- | ------ | ---- | ---------------------- |
| Content-Type  | String | 是   | 固定值`multipart/form-data` |
| Authorization | String | 是   | "Bearer " + Apikey      |

- form-data参数


| 名称       | 类型   | 必填 | 描述                                                        |
| ---------- | ------ | ---- | ----------------------------------------------------------- |
| file       | file   | 是   | 文档，支持pdf,docx,doc,xlsx,txt,pptx格式，大小<50MB |

### 响应说明

- 响应头参数


| 名称         | 值               | 描述 |
| ------------ | ---------------- | ---- |
| Content-Type | application/json |      |

- 响应体参数


| 名称 | 类型   | 值                       |
| ---- | ------ | ------------------------ |
| data | string | 文档解析结果（Markdown） |

### 请求示例

HTTP API

```Bash
curl --location --request POST 'https://www.sophnet.com/api/open-apis/projects/easyllms/doc-parse' \
--header "Authorization: Bearer $API_KEY" \
--header "Content-Type: multipart/form-data" \
--form 'file=@"YOUR_DOCUMENT"'
```

### 响应示例

```JSON
{
  "data": "文件编号：HR-2023-06-3-1\n\n发布单位：AMT\n\n发布对象：全员\n\n发布日期：2023.11.16\n\n生效日期：2023.11.16\n\n**管理制度**\n\n......"
}
```

## Image OCR

### 请求说明

- 基本信息

功能描述：图片OCR服务。发送图片，输出图片中的文本信息。

请求地址：`https://www.sophnet.com/api/open-apis/projects/easyllms/image-ocr`

请求方式：POST

- Header参数


| 名称          | 类型   | 必填 | 描述                   |
| ------------- | ------ | ---- | ---------------------- |
| Content-Type  | String | 是   | 固定值application/json |
| Authorization | String | 是   | "Bearer" + Apikey      |

- Body参数


| 名称       | 类型   | 必填 | 描述                                                                                                                                                                                            |
| ---------- | ------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| model  | string | 是   | 使用的模型，可选`PaddleOCR-VL-0.9B`，`PaddleOCR-VL-1.5`|
| type  | string | 是   | 图片类型，固定为"image_url" |
|image_url| object | 是 | 图片参数 |
|image_url.url| string | 是 | 图片，可以是base64图片，固定格式为"data:image/jpeg;base64,{base64_data}"；也可以是图片url链接 |
|prettify_markdown| bool | 否 | 是否输出美化后的 Markdown 文本。默认为 true。|
|show_formula_number| bool | 否 | 输出的 Markdown 文本中是否包含公式编号。默认为 false。|


### 响应说明

- 响应头参数


| 名称         | 值               | 描述 |
| ------------ | ---------------- | ---- |
| Content-Type | application/json |      |

- 响应体参数


| 名称 | 类型   | 值                       |
| ---- | ------ | ------------------------ |
| status | int | 0表示成功,其他值表示失败 |
| message | string | 调用成功返回请求成功,否则返回错误信息 |
| result | array(object) | 返回的结果,有一个个的段落组成,如果是use_html_out我1,则list的长度为1，有每个段落包含以下字段 |
| result[0].label | string | 段落的类型,可以是text，table，html等|
| result[0].texts | string | 段落的文本 |
| result[0].position | array(int) | 段落的位置，格式为left,top,right,bottom |
| markdown.text| string | 返回的Markdown文本,如果prettifyMarkdown为true,则会美化Markdown文本,如果showFormulaNumber为true,则会在Markdown文本中包含公式编号 |

### 请求示例

HTTP API

```Bash
curl --location --request POST 'https://www.sophnet.com/api/open-apis/projects/easyllms/image-ocr' \
--header "Authorization: Bearer $API_KEY" \
--header "Content-Type: application/json" \
--data-raw '{
    "model": "PaddleOCR-VL-0.9B",
    "type":"image_url",
    "image_url": {
            "url": "data:image/jpeg;base64,/9j/..."
    },
    "prettify_markdown": true,
    "show_formula_number": false
}'
```
### 响应示例

```JSON
{
    "status":0,
    "message":"请求成功",
    "result": [
        {
            "label": "text",
            "texts": "测试",
            "position": "0,0,720,1920"
        }
    ],
    "markdown": {"text":"测试"}
}
```
