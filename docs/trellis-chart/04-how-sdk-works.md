# How SDK Works - Custom Chart Architecture

**Fonte:** https://cyoc-documentation-site.vercel.app/charts/byoc/current/Guides/How%20SDK%20Works

---

- [Guides]
- [Custom Chart Architecture]

On this page

# How SDK Works

The SDK is a tool to integrate your custom chart with ThoughtSpot,
allowing you to incorporate features of your chart as well as features

To work with the SDK, you need to understand how it integrates with
ThoughtSpot and the flow of events exchanged between the SDK and
ThoughtSpot after integration.

## How SDK Integrates with ThoughtSpot[​](#how-sdk-integrates-with-thoughtspot "Direct link to How SDK Integrates with ThoughtSpot") 

To understand the integration of the SDK with ThoughtSpot, we will take
a look at the data flow diagram given below:

![data-flow](/charts/assets/images/Blank_diagram-5a1cb820b3e06787230e2f6a03b1ed65.png)

Let\'s break this data flow into the following steps:

1.  Interacting with Admin UI (adding chart and whitelisting the chart
    URL)
2.  Interacting with the Answer UI (event exchange between SDK and
    ThoughtSpot)

### 1. Interacting with Admin UI (Adding Chart and Whitelisting the Chart URL)[​](#1-interacting-with-admin-ui-adding-chart-and-whitelisting-the-chart-url "Direct link to 1. Interacting with Admin UI (Adding Chart and Whitelisting the Chart URL)") 

This is the first step involved in integrating the SDK with ThoughtSpot
and making TS aware of the chart you are using. This involves steps like
providing metadata for the chart, which can be seen
and whitelisting the chart URL in the TS cluster with the `tscli` flag.

For whitelisting the chart URL, you need to run the following TS cluster
command:

- For whitelisting the URL of the chart:

  Copy
  ``` bash
  tscli --adv csp add-override --source 'frame-src' --url <your-chart-url>
  ```

- For whitelisting the image URL of your chart:

  Copy
  ``` bash
  tscli csp add-override --source img-src --url <your-chart-image-url>
  ```

### 2. Interacting with the Answer UI (Event Exchange Between SDK and ThoughtSpot)[​](#2-interacting-with-the-answer-ui-event-exchange-between-sdk-and-thoughtspot "Direct link to 2. Interacting with the Answer UI (Event Exchange Between SDK and ThoughtSpot)") 

After you are done with the Admin UI, you can create an answer, and
inside the chart selector, you can select the custom chart that you have
added. This will trigger a series of events between the SDK and
ThoughtSpot through the postMessage bridge.

The initial flow starts with the `initStart` event, which is the first
event sent by your chart if you have the SDK in it, and ends with the
`initializeComplete` event. After this, you can send your own events
based on the scenarios you are dealing with. The general flow will look
like this:

![data-flow](/charts/assets/images/post-message-flow-d1d873b6cae25724ca1b45093e60f6d9.png)

The above was the general flow of how the postMessage bridge works with
TS and the SDK. The general flow is that the TS component will send a
request to postMessage with the componentId and the object value that
needs to be sent to the SDK, and postMessage will send that event to the
custom chart, process the event, and send the acknowledgment back to the
TS component via postMessage.

Now, let\'s see the flow of events in the first render of the chart on

![data-flow](/charts/assets/images/init-flow-b76ef8479611a7bcd9a0cdb07b49b67e.png)

Previous

Deploy Your Chart

Next

TS Made Example Chart

On this page

- [How SDK Integrates with
  ThoughtSpot](#how-sdk-integrates-with-thoughtspot)
  - [1. Interacting with Admin UI (Adding Chart and Whitelisting the
    Chart
    URL)](#1-interacting-with-admin-ui-adding-chart-and-whitelisting-the-chart-url)
  - [2. Interacting with the Answer UI (Event Exchange Between SDK and
    ThoughtSpot)](#2-interacting-with-the-answer-ui-event-exchange-between-sdk-and-thoughtspot)
