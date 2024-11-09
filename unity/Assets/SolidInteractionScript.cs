using System;
using System.Collections;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using MixedReality.Toolkit.UX;
using Newtonsoft.Json;
using PimDeWitte.UnityMainThreadDispatcher;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class SolidInteractionScript : MonoBehaviour
{
    public TMPro.TMP_Text solidTextMesh;
    public TMPro.TMP_Text solidTextMeshRobot;
    public string url = "currentActivity/kai";
    public string friendsEndpoint = "friends";
    public GameObject friendCheckbox; // Referenz zur Toggle-Prefab
    public Transform toggleContainer; // Referenz zum Container für die Checkboxes
    private static readonly HttpClient httpClient = new()
    {
        BaseAddress = new Uri("http://localhost:8085/"),
    };

    private List<GameObject> checkedCheckboxes = new List<GameObject>(); // Liste der angeklickten Checkboxes


    // Start is called before the first frame update
    void Start()
    {
        // Setze die Schriftgröße und aktiviere den Textumbruch
        solidTextMesh.fontSize = 8;
        solidTextMesh.enableWordWrapping = true;
        solidTextMesh.alignment = TMPro.TextAlignmentOptions.TopLeft;
        solidTextMesh.margin = new Vector4(5, 5, 5, 5);
        // Setze die Schriftgröße und aktiviere den Textumbruch
        solidTextMeshRobot.fontSize = 6;
        solidTextMeshRobot.enableWordWrapping = true;
        solidTextMeshRobot.alignment = TMPro.TextAlignmentOptions.TopLeft;
        solidTextMeshRobot.margin = new Vector4(5, 5, 5, 5);
    }

    // Update is called once per frame
    void Update()
    {

    }

    public async void GetFriends()
    {
        try
        {
            string response = await httpClient.GetStringAsync(friendsEndpoint);
            Debug.Log(response);

            if (string.IsNullOrEmpty(response))
            {
                solidTextMesh.text = "No Friends sadly";
                return;
            }

            List<Friend> friends = JsonConvert.DeserializeObject<List<Friend>>(response);

            // Entferne alle bestehenden Checkboxes
            foreach (Transform child in toggleContainer)
            {
                if (child.CompareTag("FriendCheckbox"))
                {
                    Destroy(child.gameObject);
                }
            }
            // Definiere den Abstand zwischen den Checkboxes
            float spacing = 30f; // Abstand in Einheiten

            // Erstelle eine Checkbox für jeden Freund
            for (int i = 0; i < friends.Count; i++)
            {
                GameObject checkBoxObject = Instantiate(friendCheckbox, toggleContainer);
                checkBoxObject.tag = "FriendCheckbox";

                // Setze die Position der Checkbox basierend auf dem Index
                checkBoxObject.transform.localPosition = new Vector3(i * spacing - 75, 0, 0);
                checkBoxObject.transform.localRotation = Quaternion.identity;
                checkBoxObject.transform.localScale = Vector3.one;

                TMP_Text label = checkBoxObject.GetComponentInChildren<TMP_Text>();
                label.text = friends[i].FriendName;

                PressableButton pressableButton = checkBoxObject.GetComponent<PressableButton>();
                if (pressableButton != null)
                {
                    pressableButton.OnClicked.AddListener(() => OnCheckboxClicked(checkBoxObject));
                }
                else
                {
                    Debug.LogError("PressableButton component not found in friendCheckbox prefab.");
                }

            }
        }
        catch (Exception ex)
        {
            Debug.LogError($"Error fetching classification: {ex.Message}");
        }
    }

    private void OnCheckboxClicked(GameObject checkBoxObject)
    {
        if (checkedCheckboxes.Contains(checkBoxObject))
        {
            Debug.Log("Checkbox unchecked");
            checkedCheckboxes.Remove(checkBoxObject);
        }
        else
        {
            Debug.Log("Checkbox checked");
            checkedCheckboxes.Add(checkBoxObject);
        }
    }

    public void SetUriForPerson(String name)
    {
        url = $"currentActivity/{name}";
    }

    public async void GetLatestClassification()
    {
        try
        {
            await Task.Run(async () =>
            {
                string response = await httpClient.GetStringAsync(url);
                Debug.Log(response);

                if (string.IsNullOrEmpty(response))
                {
                    UnityMainThreadDispatcher.Instance().Enqueue(() =>
                    {
                        solidTextMesh.text = "No activity detected";
                    });
                    return;
                }

                Activity activity = JsonConvert.DeserializeObject<Activity>(response);

                UnityMainThreadDispatcher.Instance().Enqueue(() =>
                {
                    solidTextMesh.text = $"Person: {activity.PersonName}\n" +
                                         $"Activity: {activity.ActivityName}\n" +
                                         $"Probability: {activity.Probability}\n" +
                                         $"End Time: {activity.EndTime}";
                });

                if (activity.ActivityName == "Read action" || activity.ActivityName == "Check action")
                {
                    try
                    {
                        // create json payload
                        string jsonPayload = JsonConvert.SerializeObject(new { mainUri = activity.MainUri });

                        StringContent httpContent = new StringContent(jsonPayload, System.Text.Encoding.UTF8, "application/json");
                        string queryResponse = await httpClient.PostAsync("query", httpContent).Result.Content.ReadAsStringAsync();
                        Debug.Log(queryResponse);

                        List<ActivityDetail> activityDetails = JsonConvert.DeserializeObject<List<ActivityDetail>>(queryResponse);

                        UnityMainThreadDispatcher.Instance().Enqueue(() =>
                        {
                            if (activityDetails != null && activityDetails.Count > 0)
                            {
                                var detail = activityDetails[0];
                                solidTextMesh.text = $"Person: {activity.PersonName}\n" +
                                                     $"Occupation: {GetUrlFragment(detail.Occupation)}\n" +
                                                     $"Specific: {GetUrlFragment(detail.Activity)}\n" +
                                                     $"Activity: {activity.ActivityName}\n" +
                                                     $"Probability: {activity.Probability}\n" +
                                                     $"End Time: {activity.EndTime}";
                                solidTextMeshRobot.text = $"Material: {GetUrlFragment(detail.Material)}\n" +
                                                          $"Comment: {detail.MaterialComment}";
                            }
                            else
                            {
                                solidTextMeshRobot.text = "No details available";
                            }
                        });
                    }
                    catch (Exception ex)
                    {
                        Debug.LogError($"Error querying activity: {ex.Message}");
                    }
                }
            });
        }
        catch (Exception ex)
        {
            Debug.LogError($"Error fetching classification: {ex.Message}");
        }
    }

    private string GetUrlFragment(string url)
    {
        if (string.IsNullOrEmpty(url))
        {
            return string.Empty;
        }

        int lastIndex = url.LastIndexOf('#');
        if (lastIndex == -1)
        {
            lastIndex = url.LastIndexOf('/');
        }

        return lastIndex != -1 ? url.Substring(lastIndex + 1) : url;
    }
    public async  void ShareWithFriends()
    {
        if (checkedCheckboxes.Count == 0)
        {
            Debug.Log("No friends selected");
            return;
        }

        try
        {
            checkedCheckboxes.RemoveAll(item => item == null);

            List<Dictionary<string, string>> friendsToShare = new List<Dictionary<string, string>>();

            foreach (var checkBox in checkedCheckboxes)
            {
                string friendName = checkBox.GetComponentInChildren<TMP_Text>().text;
                friendsToShare.Add(new Dictionary<string, string> { { "friendName", friendName } });
            }

            string jsonPayload = JsonConvert.SerializeObject(friendsToShare);
            StringContent content = new StringContent(jsonPayload, System.Text.Encoding.UTF8, "application/json");

            string response = await httpClient.PostAsync("share", content).Result.Content.ReadAsStringAsync();
            Debug.Log(response);
        }
        catch (Exception ex)
        {
            Debug.LogError($"Error sharing activity: {ex.Message}");
        }
    }
}

public class Friend
{
    [JsonProperty("friendName")]
    public string FriendName { get; set; }
}


public class Activity
{
    [JsonProperty("personName")]
    public string PersonName { get; set; }

    [JsonProperty("probability")]
    public string Probability { get; set; }

    [JsonProperty("activityName")]
    public string ActivityName { get; set; }

    [JsonProperty("endTime")]
    public DateTime EndTime { get; set; }

    [JsonProperty("mainUri")]
    public string MainUri { get; set; }
}

public class ActivityDetail
{
    [JsonProperty("occupation")]
    public string Occupation { get; set; }

    [JsonProperty("activity")]
    public string Activity { get; set; }

    [JsonProperty("material")]
    public string Material { get; set; }

    [JsonProperty("materialComment")]
    public string MaterialComment { get; set; }
}
