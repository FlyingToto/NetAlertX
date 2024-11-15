import graphene
from graphene import ObjectType, String, Int, Boolean, List, Field, InputObjectType
import json
import sys

# Register NetAlertX directories
INSTALL_PATH="/app"
sys.path.extend([f"{INSTALL_PATH}/server"])

from logger import mylog
from const import apiPath
from helper import is_random_mac, get_number_of_children, format_ip_long

# Define a base URL with the user's home directory
folder = apiPath 

# Pagination and Sorting Input Types
class SortOptionsInput(InputObjectType):
    field = String()
    order = String()

class PageQueryOptionsInput(InputObjectType):
    page = Int()
    limit = Int()
    sort = List(SortOptionsInput)
    search = String()

# Device ObjectType
class Device(ObjectType):
    rowid = Int()
    devMac = String()  
    devName = String()  
    devOwner = String() 
    devType = String()  
    devVendor = String()  
    devFavorite = Int()  
    devGroup = String()  
    devComments = String() 
    devFirstConnection = String() 
    devLastConnection = String() 
    devLastIP = String() 
    devStaticIP = Int()  
    devScan = Int()  
    devLogEvents = Int() 
    devAlertEvents = Int() 
    devAlertDown = Int()  
    devSkipRepeated = Int() 
    devLastNotification = String() 
    devPresentLastScan = Int() 
    devIsNew = Int()  
    devLocation = String() 
    devIsArchived = Int() 
    devParentMAC = String()  
    devParentPort = String()  
    devIcon = String() 
    devGUID = String() 
    devSite = String() 
    devSSID = String() 
    devSyncHubNode = String() 
    devSourcePlugin = String()
    devStatus = String()
    devIsRandomMac = Int()  
    devParentChildrenCount = Int() 
    devIpLong = Int() 


class DeviceResult(ObjectType):
    devices = List(Device)
    count = Int()

# Define Query Type with Pagination Support
class Query(ObjectType):
    devices = Field(DeviceResult, options=PageQueryOptionsInput())

    def resolve_devices(self, info, options=None):
        mylog('none', f'[graphql_schema] resolve_devices: {self}')
        try:
            with open(folder + 'table_devices.json', 'r') as f:
                devices_data = json.load(f)["data"]
        except (FileNotFoundError, json.JSONDecodeError) as e:
            mylog('none', f'[graphql_schema] Error loading devices data: {e}')
            return DeviceResult(devices=[], count=0)


        # Add dynamic fields to each device
        for device in devices_data:
            device["devIsRandomMac"] = 1 if is_random_mac(device["devMac"]) else 0
            device["devParentChildrenCount"] = get_number_of_children(device["devMac"], devices_data)
            device["devIpLong"] = format_ip_long(device.get("devLastIP", ""))

        total_count = len(devices_data)

        mylog('none', f'[graphql_schema] devices_data: {devices_data}')

        # Apply sorting if options are provided
        if options:
            if options.sort:
                for sort_option in options.sort:
                    devices_data = sorted(
                        devices_data,
                        key=lambda x: x.get(sort_option.field),
                        reverse=(sort_option.order.lower() == "desc")
                    )

            # Filter data if a search term is provided
            if options.search:
                devices_data = [
                    device for device in devices_data
                    if options.search.lower() in device.get("devName", "").lower()
                ]

            # Then apply pagination
            if options.page and options.limit:
                start = (options.page - 1) * options.limit
                end = start + options.limit
                devices_data = devices_data[start:end]

        # Convert dict objects to Device instances to enable field resolution
        devices = [Device(**device) for device in devices_data]

        return DeviceResult(devices=devices, count=total_count)



# Schema Definition
devicesSchema = graphene.Schema(query=Query)
