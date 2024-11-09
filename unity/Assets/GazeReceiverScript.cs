using ARETT;
using System;
using System.Collections;
using System.Collections.Concurrent;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;


public class GazeReceiverScript : MonoBehaviour
{
    // connect the DtatProvider-Prefab from ARETT in the Unity Editor
    public DataProvider DataProvider;
    private int packetCounter = 0;
    private ConcurrentQueue<Action> _mainThreadWorkQueue = new ConcurrentQueue<Action>();
    private bool coroutineRunning = false;
    private static readonly HttpClient pythonClient = new()
    {
        BaseAddress = new Uri("http://localhost:8081"),
    };

    private static readonly HttpClient httpClient = new()
    {
        BaseAddress = new Uri("http://localhost:8085"),
    };

    static async Task PostAsync(HttpClient httpClient, String jsonString)
    {

        // Specify the media type as "application/json" to indicate JSON content
        using StringContent jsonContent = new(jsonString, Encoding.UTF8, "application/json");

        // Post the content to the specified endpoint
        using HttpResponseMessage response = await httpClient.PostAsync("/gazeData", jsonContent);
    }

    // Start is called before the first frame update
    void Start()
    {
    }

    // Update is called once per frame
    void Update()
    {
        // Check if there is something to process
        if (!_mainThreadWorkQueue.IsEmpty)
        {
            // Process all commands which are waiting to be processed
            // Note: This isn't 100% thread save as we could end in a loop when there is still new data coming in.
            //       However, data is added slowly enough so we shouldn't run into issues.
            while (_mainThreadWorkQueue.TryDequeue(out Action action))
            {
                // Invoke the waiting action
                action.Invoke();
            }
        }
    }

    /// <summary>
    /// Starts the Coroutine to get Eye tracking data on the HL2 from ARETT.
    /// </summary>
    public void StartArettData()
    {
        if (coroutineRunning)
        {
            UnsubscribeFromARETTData();
            StopAllCoroutines();
            coroutineRunning = false;
        }
        else
        {
            StartCoroutine(SubscribeToARETTData());
            coroutineRunning = true;
        }
    }

    /// <summary>
    /// Subscribes to newDataEvent from ARETT.
    /// </summary>
    /// <returns></returns>
    private IEnumerator SubscribeToARETTData()
    {
        //*
        _mainThreadWorkQueue.Enqueue(() =>
        {
            DataProvider.NewDataEvent += HandleDataFromARETT;
        });
        //*/

        print("subscribed to ARETT events");
        yield return null;

    }

    /// <summary>
    /// Unsubscribes from NewDataEvent from ARETT.
    /// </summary>
    public void UnsubscribeFromARETTData()
    {
        _mainThreadWorkQueue.Enqueue(() =>
        {
            DataProvider.NewDataEvent -= HandleDataFromARETT;
        });

    }




    /// <summary>
    /// Handles gaze data from ARETT and allows you to do something with it
    /// </summary>
    /// <param name="gd"></param>
    /// <returns></returns>
    public void HandleDataFromARETT(GazeData gd)
    {
        packetCounter++;

        if (packetCounter >= 60)
        {
            Debug.Log("60 Pakete wurden gesendet");
            packetCounter = 0; 
        }
        // Some exemplary values from ARETT.
        // for a full list of available data see:
        // https://github.com/AR-Eye-Tracking-Toolkit/ARETT/wiki/Log-Format#gaze-data
        string t = "";
        t += "eyeDataTimestamp:" + gd.EyeDataTimestamp; 
        t += "\nisCalibrationValid:" + gd.IsCalibrationValid;
        t += "\ngazeHasValue:" + gd.GazeHasValue;
        t += "\ngazeDirection_x:" + gd.GazeDirection.x;
        t += "\ngazeDirection_y:" + gd.GazeDirection.y;
        t += "\ngazeDirection_z:" + gd.GazeDirection.z;
        
         _ = PostAsync(pythonClient, t);

        // Create an instance of the serializable class and populate it with gaze data
        GazeDataJson gazeDataJson = new GazeDataJson
        {
            eyeDataTimestamp = gd.EyeDataTimestamp,
            isCalibrationValid = gd.IsCalibrationValid,
            gazeHasValue = gd.GazeHasValue,
            gazeDirection = new GazeDirection
            {
                x = gd.GazeDirection.x,
                y = gd.GazeDirection.y,
                z = gd.GazeDirection.z
            }
        };

        // Serialize the object to a JSON string using JsonUtility
        string jsonString = JsonUtility.ToJson(gazeDataJson);

        // Send the JSON string as a payload in the PostAsync method
         _ = PostAsync(httpClient, jsonString);

    }


    [System.Serializable]
    public class GazeDirection
    {
        public float x;
        public float y;
        public float z;
    }

    [System.Serializable]
    public class GazeDataJson
    {
        public float eyeDataTimestamp;
        public bool isCalibrationValid;
        public bool gazeHasValue;
        public GazeDirection gazeDirection;
    }

}
