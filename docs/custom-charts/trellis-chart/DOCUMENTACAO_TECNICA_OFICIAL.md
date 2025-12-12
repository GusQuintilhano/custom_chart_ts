# Documentação Técnica Oficial - ThoughtSpot Chart SDK

Este documento consolida toda a documentação técnica oficial do ThoughtSpot Chart SDK de múltiplas fontes.

---

## 📚 Fontes

- [ThoughtSpot Charts SDK - GitHub README](https://github.com/thoughtspot/ts-chart-sdk/blob/main/README.md)
- [Custom Charts - ThoughtSpot Documentation](https://docs.thoughtspot.com/cloud/10.14.0.cl/chart-custom)
- [Creating Custom Charts with TSE and D3](https://developers.thoughtspot.com/guides/creating-custom-charts-with-tse-and-d3)
- [How SDK Works - Custom Chart Architecture](https://cyoc-documentation-site.vercel.app/charts/byoc/current/Guides/How%20SDK%20Works)

---

# Parte 1: ThoughtSpot Charts SDK - Initialize the Chart Context

**Fonte:** https://github.com/thoughtspot/ts-chart-sdk/blob/main/README.md

---

<p align="center">
    <img src="https://raw.githubusercontent.com/thoughtspot/visual-embed-sdk/main/static/doc-images/images/TS-Logo-black-no-bg.svg" width=120 align="center" alt="ThoughtSpot" />
</p>

<br/>

# ThoughtSpot Charts SDK

ThoughtSpot Charts SDK allows developers to integrate custom charts into ThoughtSpot. Developers can create custom charts in Javascript using charting libraries such as HighCharts and upload them to ThoughtSpot.

## ⚠️ Important Information ⚠️

### 🚀 Use `ts-chart-sdk` with TypeScript to enable static type checking.

### 📊 See [Custom Bar Chart](./example/custom-bar-chart/) example for the latest update.

---

# Get started

This tutorial demonstrates how to create a Gantt chart using HighCharts.

-   [Highchart demo link](https://www.highcharts.com/demo/gantt/progress-indicator)
-   [JSFiddle link](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/gantt/demo/progress-indicator)

## Prerequisites

Before you begin, check for the following requirements:

-   Access to a ThoughtSpot Cloud application instance
-   A Development Environment (IDE) for building custom charts
-   Working knowledge of JavaScript or Typescript
-   Familiarity with charting libraries such as Highcharts
-   Knowledge of the chart type

## Set up your environment

To create and test the application, this tutorial uses a Vite project setup.

### Create a new Vite project

1. Open a terminal window and run the following commands:

    ```bash
    md gantt
    cd gantt
    ```

2. Create a Vite project.
    ```bash
    $ npm create vite@latest
    ```
3. Configure the project name and development framework for your chart application. In this tutorial, we will use the Vanilla framework with TypeScript.

    ```bash
    ✔ Project name: … gantt demo
    ✔ Package name: … gantt-demo
    ✔ Select a framework: › Vanilla
    ✔ Select a variant: › TypeScript
    ```

4. Initialize your application.

    ```bash
    npm install
    npm run dev
    ```

### Install Highcharts and lodash

```bash
npm install --save highcharts lodash
```

### Install the SDK

```bash
npm install --save @thoughtspot/ts-chart-sdk
```

## Integrate ThoughtSpot Chart SDK

The chart imported into your application has static data. To add ThoughtSpot capabilities such as drill, you need to fetch data from your ThoughtSpot application. To add ThoughtSpot capabilities and data to the chart code in your application, integrate ThoughtSpot Chart SDK and complete these steps:

1. [Initialize the Chart Context](#initialize-the-chart-context)
2. [Create a data model from input data](#create-a-data-model-from-input-data)
3. [Plug data into the Highcharts datasets](#plug-data-into-the-highcharts-datasets)

### Initialize the Chart Context

Chart Context is the main context object that helps in orchestrating ThoughtSpot APIs to render charts. It also acts as a core central point of all interactions on the charts.

To initialize the chart context, call `getChartContext`:

```jsx
const init = async () => {
    const ctx = await getChartContext({
        getDefaultChartConfig: (chartModel: ChartModel): ChartConfig[] => {
            const columns = chartModel.columns;

            // Here we assume that the columns are always coming in the
            // following order.
            // [Project Name, Task, Start Date, End Date, Completion]

            // TBD: do basic validation here to ensure that the chart is renderable
            if (columns.length < 4) {
                // not possible to plot a chart
                return [];
            }

            const chartConfig: ChartConfig = {
                key: 'default',
                dimensions: [
                    {
                        key: 'project-name',
                        columns: [columns[0]],
                    },
                    {
                        key: 'task',
                        columns: [columns[1]],
                    },
                    {
                        key: 'start-date',
                        columns: [columns[2]],
                    },
                    {
                        key: 'end-date',
                        columns: [columns[3]],
                    },
                    {
                        key: 'completion',
                        columns: columns[4] ? [columns[4]] : [],
                    },
                ],
            };
            return [chartConfig];
        },
        getQueriesFromChartConfig: (
            chartConfig: ChartConfig[],
        ): Array<Query> => {
            // map all the columns in the config to the query array
            return chartConfig.map(
                (config: ChartConfig): Query =>
                    _.reduce(
                        config.dimensions,
                        (acc: Query, dimension) => ({
                            queryColumns: [
                                ...acc.queryColumns,
                                ...dimension.columns,
                            ],
                        }),
                        {
                            queryColumns: [],
                        } as Query,
                    ),
            );
        },
        renderChart: (context) => {},
    });
};

init();
```

> NOTE:
> For more information about the chart context component, refer to the following documentation resources:
>
> -   [https://ts-chart-sdk-docs.vercel.app/types/CustomChartContextProps.html](https://ts-chart-sdk-docs.vercel.app/types/CustomChartContextProps.html)
> -   [https://github.com/thoughtspot/ts-chart-sdk/blob/main/src/main/custom-chart-context.ts#L40](https://github.com/thoughtspot/ts-chart-sdk/blob/main/src/main/custom-chart-context.ts#L40)

The custom chart context component must include the following mandatory properties to function:

-   [`getDefaultChartConfig`](#getdefaultchartconfig-doc)
-   [`getQueriesFromChartConfig`](#getqueriesfromchartconfig-doc)
-   [`renderChart`](#renderchart-doc)

#### getDefaultChartConfig (Doc)

This function takes in a [ChartModel](https://ts-chart-sdk-docs.vercel.app/interfaces/ChartModel.html) object and returns a well-formed point configuration definition.

The point for the Gantt chart used in this tutorial looks like this:

```bash
// Project 1 - Project Name
{
    name: 'Start prototype',  // Task
    start: Date.UTC(2014, 10, 18), // Start Date
    end: Date.UTC(2014, 10, 25), // End Date
    completed: {
        amount: 0.25, // Completion
    },
}
```

To create a Highcharts version of the data set, the above-mentioned headers must be presented as columns from ThoughtSpot. The query on the ThoughtSpot Answer page should have all the above columns to plot a Gantt chart.

Ensure that the `getDefaultChartConfig` method is included in chartContext to define the configuration of the columns that are required to map the dataset into the chart. We assume that the order of the column is maintained in the chartModel.

To render the chart, the default configuration is required.

```jsx
getDefaultChartConfig: (chartModel: ChartModel): ChartConfig[] => {
    const columns = chartModel.columns;

    // Here we assume that the columns are always coming in the
    // following order.
    // [Project Name, Task, Start Date, End Date, Completion]

    // TBD: do basic validation here to ensure that the chart is renderable
    if (columns.length < 4) {
        // not possible to plot a chart
        return [];
    }

    const chartConfig: ChartConfig = {
        key: 'default',
        dimensions: [
            {
                key: 'project-name',
                columns: [columns[0]],
            },
            {
                key: 'task',
                columns: [columns[1]],
            },
            {
                key: 'start-date',
                columns: [columns[2]],
            },
            {
                key: 'end-date',
                columns: [columns[3]],
            },
            {
                key: 'completion',
                columns: columns[4] ? [columns[4]] : [],
            },
        ],
    };
    return [chartConfig];
},
```

#### getQueriesFromChartConfig (Doc)

This method defines the data query that is required to fetch the data from ThoughtSpot to render the chart. For most use cases, you do not require the data outside of the columns listed in your chart.

This example maps all the columns in the configuration as an array of columns in the arguments.

```jsx
getQueriesFromChartConfig: (
    chartConfig: ChartConfig[],
): Array<Query> => {
    // map all the columns in the config to the query array
    return chartConfig.map(
        (config: ChartConfig): Query =>
            _.reduce(
                config.dimensions,
                (acc: Query, dimension) => ({
                    queryColumns: [
                        ...acc.queryColumns,
                        ...dimension.columns,
                    ],
                }),
                {
                    queryColumns: [],
                } as Query,
            ),
    );
},
```

#### renderChart (Doc)

This `renderChart` function is required to render the chart implemented in your code. This function ensures that every time `chartContext` tries to re-render the chart due to the changes in data or chart model, the chart rendered in your application is updated.

> **Note**:
> You can control render and re-render by implementing more granular control for the updates on data, visual props, or chart model.

## Deploy your chart

If the chart creation is successful, you can host it on a server and make it available for use:

To deploy your charts, you can use Vercel, Netlify, or any server that can render an HTML page. For information, see [Vite documentation](https://vercel.com/docs/frameworks/vite).

To deploy the chart on a test domain in Vercel, install [Vercel CLI](https://vercel.com/docs/cli) and run the following command:

```jsx
vercel;
```

### Content Security Policy Overrides

To allow the use of Vercel application content in Thoughtspot, add the Vercel domain URL to the CSP allow-list. For more information, see the [Security settings section in ThoughtSpot documentation](https://developers.thoughtspot.com/docs/?pageid=security-settings).

## Useful URLs

### API references

-   Check out [ts-charts-sdk docs](https://ts-chart-sdk-docs.vercel.app/) to get API reference.

### Test framework

-   Open [Playground](https://byoc-playground.vercel.app/) to play with ts-chart-sdk with mock chartModel.

## FAQ

#### How to save some chart specific state after client have made some changes in charts?

You can use `ChartToTSEvent.UpdateVisualProps` eventType inside `ctx.emitEvent()`. Since the payload type for this event is `unkown` you can just add a key value pair naming `clientState`.

**Sample** -

```js
ctx.emitEvent(ChartTOTSEvent.UpdateVisualProps,{
    visualProps:{
        clientState:"<req_state_in_string_format>"
        ...rest_of_visualProp
    }
})
```

-   NOTE: client State currently support only string data type. To use it with json object you can use `JSON.stringify(somelocalstate)`

#### Why my chart is getting re render in an infinte loop?

Probably you are implementing `update client state` logic inside the the `render` function of `getChartContext`. Since it `render` will be calling `update client state` logic and this logic might again cause `render` this will cause a cyclic call of `render`. Hence,it is advised not to implement it inside `render` function.

> NOTE:
> This can be called inside render function just that to avoid having an infinite loop clientState updates should be handled by chart developer properly.

#### How to add dynamic config for visualPorpEditorDefintion?

Since in our previous implementation of `visualPropEditorDefintion` we provided this as an static object of type `VisualPropEditorDefinition` but with the resent update this is converted function of type `VisualEditorDefinitonSetter` along with `VisualEditorDefintion`. So currently you can provide static config or dynamic config based on use case.

#### Only 1000 points are getting fetched for my query even though there are more results. How to increase that?

In `getQueriesFromChartConfig` along with `QueryColumn` you can provide additional optional key `queryParams`. In `queryParams` you can provide `size` to deal with the number of data points that need to fetched. Also there is hard limit of 100K data points to be fetched from the backend.

#### Why is my chart is getting error corresponding to timeout even though I have imeplemented everything right?

In the TS component that is reacting with your sdk code we have added certain timeouts for gracefully handling long time inactivity on postMessage and renderChart function that ones implements. We have added timeout for 30 sec `PostMessage` API so if the event from TSToChart or ChartToTS take more then 30 sec to get a response we automatically get into a error state through timeout. Also we have 60 sec timeout for `renderChart` functionality. This timeout start ones `InitilaizeComplete` event triggers from from the TS and expect to recieve `renderComplete` or `renderError` event within 60 sec of `InitializeComplete`.

---

# Parte 2: Custom Charts - ThoughtSpot Documentation

**Fonte:** https://docs.thoughtspot.com/cloud/10.14.0.cl/chart-custom

---

# Custom charts

Custom charts give you the ability to create chart types to visualize your data, by using any charting library created outside of ThoughtSpot. You can also access ready-to-use charts created by partners. Custom charts are compatible with native ThoughtSpot features like drill down.

This article describes how you use a custom chart and how your ThoughtSpot administrator can add, edit, and delete custom charts.

## Options for custom charts

- Access a library of custom charts that can be installed in seconds, with our partner Vitara. Vitara requires a separate subscription.
- Use Muse Studio to create your own charts in ThoughtSpot.
- Developers can create custom charts in Javascript using charting libraries such as [Highcharts](https://www.highcharts.com/). For more information, refer to the [ThoughtSpot Charts SDK documentation](https://github.com/thoughtspot/ts-chart-sdk/blob/main/README.md/).
- ThoughtSpot professional services can create custom charts for you.

To enable the custom charts feature, contact your administrator.

## Using custom charts

To use a custom chart, do the following:

1. Click the **Change visualization** button
2. Below the list of default charts, select a custom chart.

## Administering custom charts

A ThoughtSpot administrator can add custom charts to your cluster, as well as edit and delete them. Before adding custom charts, the administrator must add the domains where the custom chart and chart icon are hosted to the list of permitted iFrame and CSP img-src domains in ThoughtSpot. Without performing this step, the custom chart cannot be displayed.

### Adding domains to the permitted iFrame and CSP img-src domains

The ThoughtSpot administrator must enter the domain for both the chart and chart icon.

To add the domain for a custom chart and chart icon, do the following:

1. Select **Develop** from the navigation bar.
2. Navigate to **All Orgs** > **Security settings**.
3. Click **Edit**.
4. In the **Permitted iFrame domains** field enter the domain where the chart is hosted.
5. In the **CSP img-src domains** field enter the domain where the chart icon is hosted.
6. Click **Save Changes**.

### Adding a custom chart to a ThoughtSpot cluster

To add a custom chart, the ThoughtSpot administrator does the following:

1. Select **Admin** in the top navigation bar.
2. Select **All Orgs**
3. Under *Application settings*, Select **Chart customization**.
4. Select the **Custom charts** tab.
5. Click **Add chart**

The Add custom chart window appears.

6. Enter the following fields:

    - Name
    - Description (optional)
    - Application URL
    - Icon URL (optional)
    - Author name (optional)
    - Author email (optional)
    - Author organization (optional)

7. Click **Add chart**.

Your new chart appears on the *Custom charts* page, and is now available for use when creating a chart in ThoughtSpot.

### Editing a custom chart

To edit a custom chart, the ThoughtSpot administrator does the following:

1. Select **Admin** in the top navigation bar.
2. Under *Application settings*, Select **Chart customization**.
3. Select the **Custom charts** tab.
4. Find the name of the chart you want to change, and click **Edit**.
5. In the *Update custom chart* window, make any changes necessary.

### Deleting a custom chart

To delete a custom chart, the ThoughtSpot administrator does the following:

1. Select **Admin** in the top navigation bar.
2. Under *Application settings*, Select **Chart customization**.
3. Select the **Custom charts** tab.
4. Find the name of the chart you want to delete, and click **Delete**.
5. In the *Delete custom chart* warning message which appears, click **Delete**.

---

# Parte 3: Creating Custom Charts with TSE and D3

**Fonte:** https://developers.thoughtspot.com/guides/creating-custom-charts-with-tse-and-d3

---

# Creating custom charts with TSE and D3

ThoughtSpot Everywhere offers different options for developers to embed analytics into their webapps. This tutorial will walk you through how to use the ThoughtSpot Everywhere REST APIs to retrieve data and map them to [D3.js](https://d3js.org/), a popular open source charting library, from a ReactJS web app. The utilities provided and API calls will be identical for other charting libraries such as [Highcharts](https://www.highcharts.com/) or [AnyChart](https://www.anychart.com/).

## Overview

This tutorial demonstrates how to:
- Use ThoughtSpot REST APIs to retrieve data
- Map data to D3.js charts
- Create Gauge and Bar charts
- Deploy custom charts

## Getting Started

If you don't already have a ThoughtSpot account, go ahead and sign up for a [free trial](https://www.thoughtspot.com/trial?tsref=dev-qs-d3).

This tutorial will build a ReactJS webapp to embed the analytics. Make sure that you have a recent version of node.js and npm installed.

You will need at least the following version:
- Node.js : v16.3+
- NPM v8.1+

## Environment Variables

Create a `.env` file in your project's root directory with the following environment variables:

```
REACT_APP_TS_URL=https://my1.thoughtspot.cloud
REACT_APP_TS_USERNAME=yourEmail@example.com
REACT_APP_TS_PASSWORD=yourPassword
```

Remember not to include a trailing `/`.

## Helper Libraries

The API helper classes included in this tutorial are intentionally very light. They provide convenience wrappers for authentication and the search data endpoint only. It is recommended that you use one of the [CodeSpot](https://developers.thoughtspot.com/codespot) libraries for production use.

Create helper files in your `src/utils` directory:
- `GaugeChart.js`
- `d3-helpers.js`
- `thoughtspot-rest-api-v1-helpers.js`

## Creating Charts

### Gauge Chart Example

```javascript
import React, { useEffect, useState } from 'react';
import { GaugeChart } from './utils/GaugeChart';
import { tsLogin, getSearchData } from './utils/thoughtspot-rest-api-v1-helpers';

const tsURL = process.env.REACT_APP_TS_URL;
const USER = process.env.REACT_APP_TS_USERNAME;
const PASSWORD = process.env.REACT_APP_TS_PASSWORD;

const worksheetID = "YOUR-WORKSHEET-ID";
const search1 = "[sales] [item type] top 1"; //Most sold item

export default function GaugeExample(props) {
    const [value, setValue] = useState(null);
    const [cfg, setCfg] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            const responseLogin = await tsLogin(tsURL, USER, PASSWORD);
            const responseSearch1 = await getSearchData(tsURL, worksheetID, search1);
            const apiData1 = await responseSearch1.data;

            var cfg = {};
            cfg.label = "Total " + apiData1[0][0] + ' sales ';
            setCfg(cfg);
            setValue(Math.round(apiData1[0][1]/1000000));
        };

        fetchData();
    }, []);

    if (value) {
        return (
            <div className="chart-gauge">
                <h1>Gauge Radar</h1>
                <GaugeChart value={value} cfg={cfg}/>
            </div>
        );
    } else {
        return <div>Loading...</div>;
    }
}
```

### Bar Chart Example

```javascript
import React, { useEffect, useRef, useState } from 'react';
import { tsLogin, getSearchData } from './utils/thoughtspot-rest-api-v1-helpers';
import { BarChart } from './utils/d3-helpers';
import * as d3 from "https://cdn.skypack.dev/d3@7";

const tsURL = process.env.REACT_APP_TS_URL;
const USER = process.env.REACT_APP_TS_USERNAME;
const PASSWORD = process.env.REACT_APP_TS_PASSWORD;

const worksheetID = "cd252e5c-b552-49a8-821d-3eadaa049cca";
const search = "[sales] [item type]";

export default function BarExample(props) {
    const [data, setData] = useState(null);
    const svg = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            const responseLogin = await tsLogin(tsURL, USER, PASSWORD);
            const responseSearch = await getSearchData(tsURL, worksheetID, search);
            const apiData = await responseSearch.data;

            const formattedData = [];
            apiData.forEach((chartRow, index) => {
                formattedData[index] = chartRow;
            });
            formattedData["columns"] = ["name", "value"];

            const chart = BarChart(formattedData, {});

            if (svg.current && chart !== undefined) {
                svg.current.appendChild(chart);
            }

            setData(formattedData);
        };

        fetchData();
    }, []);

    if (data) {
        return (
            <div className="chart-bar">
                <h1>Bar Chart</h1>
                <div ref={svg}></div>
            </div>
        );
    } else {
        return <div>Loading...</div>;
    }
}
```

---

# Parte 4: How SDK Works - Custom Chart Architecture

**Fonte:** https://cyoc-documentation-site.vercel.app/charts/byoc/current/Guides/How%20SDK%20Works

---

# How SDK Works

The SDK is a tool to integrate your custom chart with ThoughtSpot, allowing you to incorporate features of your chart as well as features from ThoughtSpot.

To work with the SDK, you need to understand how it integrates with ThoughtSpot and the flow of events exchanged between the SDK and ThoughtSpot after integration.

## How SDK Integrates with ThoughtSpot

To understand the integration of the SDK with ThoughtSpot, we will take a look at the data flow diagram given below:

The data flow can be broken into the following steps:

1. Interacting with Admin UI (adding chart and whitelisting the chart URL)
2. Interacting with the Answer UI (event exchange between SDK and ThoughtSpot)

### 1. Interacting with Admin UI (Adding Chart and Whitelisting the Chart URL)

This is the first step involved in integrating the SDK with ThoughtSpot and making TS aware of the chart you are using. This involves steps like providing metadata for the chart, which can be seen in the Admin UI, and whitelisting the chart URL in the TS cluster with the `tscli` flag.

For whitelisting the chart URL, you need to run the following TS cluster command:

- For whitelisting the URL of the chart:

  ```bash
  tscli --adv csp add-override --source 'frame-src' --url <your-chart-url>
  ```

- For whitelisting the image URL of your chart:

  ```bash
  tscli csp add-override --source img-src --url <your-chart-image-url>
  ```

### 2. Interacting with the Answer UI (Event Exchange Between SDK and ThoughtSpot)

After you are done with the Admin UI, you can create an answer, and inside the chart selector, you can select the custom chart that you have added. This will trigger a series of events between the SDK and ThoughtSpot through the postMessage bridge.

The initial flow starts with the `initStart` event, which is the first event sent by your chart if you have the SDK in it, and ends with the `initializeComplete` event. After this, you can send your own events based on the scenarios you are dealing with.

The general flow is that the TS component will send a request to postMessage with the componentId and the object value that needs to be sent to the SDK, and postMessage will send that event to the custom chart, process the event, and send the acknowledgment back to the TS component via postMessage.

---

## 📚 Referências

- [ThoughtSpot Chart SDK GitHub](https://github.com/thoughtspot/ts-chart-sdk)
- [Chart SDK API Reference](https://ts-chart-sdk-docs.vercel.app/)
- [ThoughtSpot Documentation](https://docs.thoughtspot.com/)
- [ThoughtSpot Developers Portal](https://developers.thoughtspot.com/)

---

**Última atualização:** 2025-01-03  
**Consolidado de:** 4 documentos técnicos oficiais

