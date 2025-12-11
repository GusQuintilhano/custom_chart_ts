# Creating Custom Charts with TSE and D3

**Fonte:** https://developers.thoughtspot.com/guides/creating-custom-charts-with-tse-and-d3

---

- [Overview](#0)
- [Getting Started](#1)
- [Add Helpers](#2)
- [Create Gauge Chart](#3)
- [Add Routes](#4)
- [Run and Add Styling](#5)
- [Add a Bar Chart](#6)
- [Summary](#7)

# Creating custom charts with TSE and D3 

- [[1] Overview](#0)
- [[2] Getting Started](#1)
- [[3] Add Helpers](#2)
- [[4] Create Gauge Chart](#3)
- [[5] Add Routes](#4)
- [[6] Run and Add Styling](#5)
- [[7] Add a Bar Chart](#6)
- [[8] Summary](#7)

## 1. Overview 

Duration: 0:02:00

ThoughtSpot Everywhere offers different options for developers to embed
analytics into their webapps. This tutorial will walk you through how to
use the ThoughtSpot Everywhere REST APIs to retrieve data and map them
to [[D3.js]](https://d3js.org/), a popular open source
charting library, from a ReactJS web app. The utilities provided and API
calls will be identical for other charting libraries such as
[[Highcharts]](https://www.highcharts.com/) or
[[AnyChart]](https://www.anychart.com/). You will just need

## 2. Getting Started 

Duration: 0:15:00

If you don't already have a ThoughtSpot account, go ahead and sign up
trial]](https://www.thoughtspot.com/trial?tsref=dev-qs-d3).
Once you received your credentials via the email verification, you can

This tutorial will build a ReactJS webapp to embed the analytics. Make
sure that you have a recent version of node.js and npm installed. You
can test which version you have by executing the following command in a
terminal window:

You will need at least the following version.

- Node.js : v16.3+
- NPM v8.1+

With the local environment set up, let's start building our app. From

Then, change directories into tsed3app, and install react-router-dom:

Next, open the project in your favorite IDE. We will be using VSCode
throughout this tutorial, but you can use whichever IDE you prefer. Once
open, select package.json and set the port which your app will use, to
8000. ThoughtSpot Everywhere whitelists port 8000. If you do not perform
this step, you will receive a CORS error later in the tutorial when you

    "start": "PORT=8000 react-scripts start",

Replace the contents of index.js with the following code to set up your
app to use react-router-dom:

    import React from 'react';import ReactDOM from 'react-dom';import  from 'react-router-dom';import './index.css';import App from './App';ReactDOM.render(<Router>  <App /></Router>

The last thing we need to do to configure our app is set a few
environment variables. In a few minutes we will add some helper
libraries to bind ThoughtSpot data structure to d3 and make it easy to
authenticate against ThoughtSpot via the REST APIs. These helpers rely
on the following environment variables to connect to your ThoughtSpot
instance. Go ahead and create a new file, .env, in your project's root
directory (at the same level as package.json) with the following
environment variables. If you are using the Free Trial account, you will
not need to change the REACT_APP_TS_URL value, otherwise log into your
instance via the browser and copy the domain. Your ThoughtSpot trial URL
may begin with my1.thoughtspot.cloud or my2.thoughtspot.cloud, so match

Remember not to include a trailing /.

    REACT_APP_TS_URL=https://my1.thoughtspot.cloud[email protected]REACT_APP_TS_PASSWORD=yourPassword

## 3. Add Helpers 

Duration: 0:10:00

Now that we have our app configured, we are going to add a few helper
classes to handle binding to D3, and authenticating and working with the
ThoughtSpot Everywhere REST API.

Positive

: The API helper classes included in this tutorial are intentionally
very light. They provide convenience wrappers for authentication and the
search data endpoint only. It is recommended that you use one of the
[[CodeSpot]](https://developers.thoughtspot.com/codespot).

Create two folders in the src directory of your project:

Then, copy the following three files from GitHub into the utils
directory you just created:

- [[GaugeChart.js]](https://github.com/thoughtspot/quickstarts/blob/main/build-charts-with-d3/complete-app/src/components/utils/GaugeChart.js)
- [[d3-helpers.js]](https://github.com/thoughtspot/quickstarts/blob/main/build-charts-with-d3/complete-app/src/components/utils/d3-helpers.js)
- [[thoughtspot-rest-api-v1-helpers.js]](https://github.com/thoughtspot/quickstarts/blob/main/build-charts-with-d3/complete-app/src/components/utils/thoughtspot-rest-api-v1-helpers.js)

## 4. Create Gauge Chart 

Duration: 0:15:00

It's time to put all of this preparation into action. We will create a
gauge chart to show sales of the most popular item in the ThoughtSpot
sample retail dataset. This dataset comes preinstalled in your trial
environment and is very helpful. to experiment with how to build apps

Within the src/components folder, create a new file, GaugeExample.js.

Add the required imports:

    import React,  from 'react';import  from './utils/GaugeChart'import  from './utils/thoughtspot-rest-api-v1-helpers';

And, create the default function:

    export default function GaugeExample(props) 

Then, create the following constants to use within our function. The
first three constants are used to authenticate against ThoughtSpot and
tell the helper library which ThoughtSpot domain to append to REST API
endpoints. The values of these constants use the .env configuration you

  -----------------------------------------------------------------------------------------------------------------------------------------------------------
  **const** tsURL = process.env.REACT_APP_TS_URL;**const** USER = process.env.REACT_APP_TS_USERNAME;**const** PASSWORD = process.env.REACT_APP_TS_PASSWORD;
  -----------------------------------------------------------------------------------------------------------------------------------------------------------

    REACT_APP_TS_URL=https://my1.thoughtspot.cloud[email protected]REACT_APP_TS_PASSWORD=yourPassword

Next, add two more constants. The first identifies the worksheet we want
to query against to retrieve data. To get your worksheet id, log into
your instance and navigate to **Data \> Worksheets and select Sample
Retail - Apparel**. In the browser URL, copy and paste the id into your

    const worksheetID = "YOUR-WORKSHEET-ID";const search1 = "[sales] [item type] top 1"; //Most sold item

The second constant, search1 is a search term used to query data. For
our Gauge Chart we want to retrieve a single item and show the sales for

All that is left to do now is query ThoughtSpot and map the results to
the chart. Add the following code into the GaugeExample function. Once
completed, we will walk through the important aspects.

    export default function GaugeExample(props) ;        //Pull name of the most sold item from API        cfg.label = "Total " + apiData1[0][0] + ' sales ';        setCfg(cfg);        setValue( Math.round(apiData1[0][1]/1000000) );     };    fetchData();}, []);if (value)  cfg=/>                                );    }    else }

Let's break down what is going on here. First, we make an async call to
ThoughtSpot and await for the response. We take advantage of the helper
library to perform the heavy lifting of authenticating and calling the
API]](https://developers.thoughtspot.com/docs/?pageid=search-data-api#search-data-api-ref).

    const responseLogin = await tsLogin(tsURL, USER, PASSWORD);const responseSearch1 = await getSearchData(tsURL, worksheetID, search1);const apiData1 = await responseSearch1.data; 

If you want to test your query before writing code, the Developer REST
Playground is a fantastic resource to help you learn and test API
endpoints. It is great practice to test here first, then add to your

Log in your ThoughtSpot instance, tap **Develop \> REST API Playground
v2**, then from the left-hand navigation, expand Data, and select Search
Query Data. Try adding your worksheet id and search term defined in the

![](/tutorials/creating_custom_charts_with_tse_and_d3/265271fdba1d7ff275a779cc82f793a3.jpg)

Positive

: This tutorial uses the REST API v1 endpoints. The REST API v2 is still

If successful, you will see the Response Body as a json payload. This is

![](/tutorials/creating_custom_charts_with_tse_and_d3/4f1bf6052019c020d8bcf6dfea397288.jpg)

Then, when we have the results, we configure the chart and map the data
to it:

    var cfg = ;        //Pull name of the most sold item from API        cfg.label = "Total " + apiData1[0][0] + ' sales ';        setCfg(cfg);        setValue( Math.round(apiData1[0][1]/1000000) );     };

And, finally pass everything to the helper class to display it

    <div className="chart-gauge">        <h1>Gauge Radar</h1>      <GaugeChart value= cfg=/>

## 5. Add Routes 

Duration: 0:10:00

Now that our chart is all set up, all that is left to do is to add the
routes and navigation to the app home page. In your IDE, select App.js
and rename it to App.jsx, then replace the contents with the following
code:

    import './App.css';import  from "react-router-dom";import GaugeExample from './components/GaugeExample';function App()  />        <Route path="/GaugeExample" element= />          </Routes>      <ul>        <li> <a className="bm-item" href="/">Home</a></li>         <li> <a className="bm-item" href="/GaugeExample">GaugeExample</a> </li>      </ul>      ); } export default App;

## 6. Run and Add Styling 

Duration: 0:05:00

That's it. You are ready to test your app. Save all of your changes, and
start the app:

Once your app starts, tap on the GaugeExample, and you should see a

![](/tutorials/creating_custom_charts_with_tse_and_d3/fb9f04dccefed7e9355d2141008d2cb1.jpg)

Our chart shows the number of sales for the top selling product, but
it's not that exciting. Let's add a little color. Open src/index.css and
replace the contents with the following css:

    body code .content/* Styles for Interactive Radar Chart  */.interactive-radar-container .legende .interactive-radar-container .recta .interactive-radar-container .legend .interactive-radar-container .tooltip .interactive-radar-container /* Styles for GaugeChart */.chart-gauge .chart-gauge .chart-first .chart-gauge .chart-second .chart-gauge .chart-third .chart-gauge .needle, .needle-center .chart-gauge .text .chart-gauge svg /* Styles for Bubble US Map */.chart-map /* Word cloud Styles*/.word-cloud 

Save your changes, and check out the chart now. Much better!

![](/tutorials/creating_custom_charts_with_tse_and_d3/28c1a2f104e859bfb5698618d744f14d.jpg)

## 7. Add a Bar Chart 

Duration: 0:15:00

Another very common chart for displaying data is a Bar Chart.
ThoughtSpot natively supports Bar Charts in embed components, but if you
are using the search data API, it is quite likely that you will be asked
to map ThoughtSpot analytics to a Bar Chart. Now that you have all the
helpers set up in your app, doing so is very easy.

Go ahead and create a new file src/components/BarExample.js and paste in

    import React,  from 'react';import  from './utils/thoughtspot-rest-api-v1-helpers';import  from './utils/d3-helpers';import * as d3 from "https://cdn.skypack.dev/d3@7";const tsURL = process.env.REACT_APP_TS_URL;const USER = process.env.REACT_APP_TS_USERNAME;const PASSWORD = process.env.REACT_APP_TS_PASSWORD;const worksheetID = "cd252e5c-b552-49a8-821d-3eadaa049cca";const search = "[sales] [item type]";export default function BarExample(props) ;                formattedData[index] = chartRow;            });            formattedData["columns"] = ["name", "value"];                    const chart = BarChart(formattedData, );            //svg is a mutable ref object whose .current property is initialized to the passed argument (initialValue).             //See. https://reactjs.org/docs/hooks-reference.html#useref            if (svg.current && chart !== undefined)         };        fetchData();    }, []);    if (data) />);        }        else     }

This code should look very familiar to you now: we retrieve environment
variables for authentication, call getSearchData passing in a worksheet

Next, add the imports and routing into src/App.jsx. Your final file
should look like this:

    import './App.css';import  from "react-router-dom";import GaugeExample from './components/GaugeExample';import BarExample from './components/BarExample';function App()  />        <Route path="/GaugeExample" element= />        <Route path="/BarExample" element= />              </Routes>      <ul>        <li> <a className="bm-item" href="/">Home</a></li>         <li> <a className="bm-item" href="/GaugeExample">GaugeExample</a> </li>         <li> <a className="bm-item" href="/BarExample">BarExample</a> </li>       </ul>      ); } export default App;

Save and run your application, this time tapping on the Bar Example

![](/tutorials/creating_custom_charts_with_tse_and_d3/88dba5c594cd9720e3acb4cbb2852991.jpg)

## 8. Summary 

Duration: 0:03:00

Throughout this tutorial you learned how to use the ThoughtSpot REST
APIs to search for data and map it to the D3 charting library. You
created a Gauge and Bar Chart to demonstrate how the helper libraries
assist in quickly mapping result sets. You can access the complete
[[here]](https://github.com/thoughtspot/quickstarts/tree/main/build-charts-with-d3/complete-app).
In addition, if you want additional chart examples including wordcloud,
sunburst, radial, and more, check out the D3 Sample showcase in
[[CodeSpot]](https://developers.thoughtspot.com/codespot/d3-sample-showcase).
